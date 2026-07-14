import time
import json
import asyncio
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, redis_client
from app.models.postgres import CoordinateLog

def save_batch(db: Session, batch: list):
    try:
        # Use bulk_insert_mappings for fast insert
        db.bulk_insert_mappings(CoordinateLog, batch)
        db.commit()
        print(f"Bulk saved {len(batch)} coordinates to TimescaleDB/PostgreSQL.")
    except Exception as e:
        db.rollback()
        print(f"Failed to bulk save coordinates: {e}")

def run_sync_consumer():
    """
    Synchronous consumer loop.
    """
    db = SessionLocal()
    # Start reading from the latest or beginning. For dev/simulation, starting from '0-0' ensures we process everything.
    last_id = '0-0'
    
    # Initialize the stream if it does not exist
    try:
        redis_client.xread({"stream:shopper_movements": "0-0"}, count=1)
    except Exception:
        pass

    batch = []
    last_save_time = time.time()
    
    print("Stream worker synchronous loop started...")
    
    while True:
        try:
            # Read from Redis stream (block up to 1000ms)
            streams = redis_client.xread({"stream:shopper_movements": last_id}, count=100, block=1000)
            if not streams:
                # If nothing, check if we need to flush current batch (e.g. if time has passed)
                if batch and (time.time() - last_save_time > 2.0):
                    save_batch(db, batch)
                    batch = []
                    last_save_time = time.time()
                time.sleep(0.1)
                continue
                
            for stream_name, messages in streams:
                for msg_id, data in messages:
                    session_uuid = data.get("session_uuid")
                    store_id = data.get("store_id")
                    camera_id = data.get("camera_id")
                    timestamp_str = data.get("timestamp")
                    x = float(data.get("x", 0.0))
                    y = float(data.get("y", 0.0))
                    velocity = float(data.get("velocity", 0.0))
                    
                    try:
                        timestamp = datetime.fromisoformat(timestamp_str)
                    except Exception:
                        timestamp = datetime.utcnow()
                        
                    batch.append({
                        "session_uuid": session_uuid,
                        "store_id": store_id,
                        "camera_id": camera_id,
                        "timestamp": timestamp,
                        "x": x,
                        "y": y,
                        "velocity": velocity
                    })
                    last_id = msg_id
                    
            if len(batch) >= 100 or (batch and (time.time() - last_save_time > 2.0)):
                save_batch(db, batch)
                batch = []
                last_save_time = time.time()
                
        except Exception as e:
            # If Redis or database fails, log and retry
            print(f"Error in stream worker loop: {e}")
            time.sleep(2)

def start_stream_worker_async():
    """
    Starts the stream worker in a daemon thread.
    """
    import threading
    t = threading.Thread(target=run_sync_consumer, name="StreamWorker", daemon=True)
    t.start()


if __name__ == "__main__":
    run_sync_consumer()
