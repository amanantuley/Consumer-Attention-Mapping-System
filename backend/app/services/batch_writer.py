import time
import logging
import threading
from datetime import datetime, timezone
from ..core.redis import get_redis
from ..core.database import SessionLocal
from ..models.coordinate_log import CoordinateLog

logger = logging.getLogger(__name__)


class BatchWriterWorker:
    """
    Background worker that pools coordinate log queues and executes
    high-speed bulk inserts into PostgreSQL.
    """
    def __init__(self):
        self.redis = get_redis()
        self.stop_event = threading.Event()
        self.thread = None
        self.batch_size = 100
        self.flush_interval = 5.0  # seconds

    def start(self):
        self.stop_event.clear()
        self.thread = threading.Thread(target=self._run_loop, name="BatchWriterThread", daemon=True)
        self.thread.start()
        logger.info("BatchWriterWorker background thread started.")

    def stop(self):
        self.stop_event.set()
        if self.thread:
            self.thread.join(timeout=3.0)
            logger.info("BatchWriterWorker background thread stopped.")

    def _run_loop(self):
        batch = []
        last_flush_time = time.time()
        last_id = "0-0"
        
        while not self.stop_event.is_set():
            try:
                # Read from Redis stream (block up to 1000ms if empty)
                response = self.redis.xread({"coordinate_stream": last_id}, count=self.batch_size, block=1000)
                
                if response:
                    for stream_name, entries in response:
                        for entry_id, fields in entries:
                            batch.append({
                                "store_id": int(fields["store_id"]),
                                "camera_id": int(fields["camera_id"]),
                                "shopper_id": fields["shopper_id"],
                                "x_coord": float(fields["x_coord"]),
                                "y_coord": float(fields["y_coord"]),
                                "zone": fields["zone"],
                                "timestamp": datetime.fromtimestamp(float(fields["timestamp"]), tz=timezone.utc)
                            })
                            # Track last processed ID for streaming continuation
                            last_id = entry_id
                
                # Check if batch needs flushing
                now = time.time()
                if len(batch) >= self.batch_size or (len(batch) > 0 and (now - last_flush_time) >= self.flush_interval):
                    self._flush_batch(batch)
                    batch.clear()
                    last_flush_time = now
                    
            except Exception as e:
                logger.error(f"Error in BatchWriterWorker thread: {e}")
                time.sleep(1.0)
                
        # Flush any remaining items before exiting
        if batch:
            try:
                self._flush_batch(batch)
            except Exception as e:
                logger.error(f"Error flushing final batch on exit: {e}")

    def _flush_batch(self, batch_data):
        if not batch_data:
            return
            
        db = SessionLocal()
        try:
            # bulk insert mapping for optimization
            db.bulk_insert_mappings(CoordinateLog, batch_data)
            db.commit()
            logger.info(f"Successfully flushed batch of {len(batch_data)} coordinate logs to PostgreSQL.")
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to bulk-insert batch logs to PostgreSQL: {e}")
        finally:
            db.close()
