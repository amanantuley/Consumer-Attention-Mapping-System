import queue
import logging
from typing import Dict, Any, List
import redis
from .config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class MockRedis:
    """
    Fallback in-memory Mock Redis implementation for environments
    without a running Redis instance or Docker support.
    """
    def __init__(self):
        self._queues = {}
        self._hashes = {}
        self._kvs = {}
        logger.warning("MockRedis initialized. Active in-memory fallback for streams and cache.")

    def xadd(self, name: str, fields: Dict[str, Any], id: str = "*") -> str:
        if name not in self._queues:
            self._queues[name] = queue.Queue()
        self._queues[name].put(fields)
        return "12345-0"

    def xread(self, streams: Dict[str, str], count: int = None, block: int = None) -> List[Any]:
        results = []
        for stream_name in streams:
            if stream_name not in self._queues:
                self._queues[stream_name] = queue.Queue()
            
            q = self._queues[stream_name]
            items = []
            
            # Wait if blocking and queue is empty
            if block and q.empty():
                try:
                    # convert block ms to seconds
                    item = q.get(timeout=block / 1000.0)
                    items.append(("12345-0", item))
                except queue.Empty:
                    pass
            
            # Pull remaining up to count
            limit = count or 100
            while len(items) < limit and not q.empty():
                try:
                    item = q.get_nowait()
                    items.append(("12345-0", item))
                except queue.Empty:
                    break
            
            if items:
                results.append((stream_name, items))
        return results

    def hset(self, name: str, key: str, value: str) -> int:
        if name not in self._hashes:
            self._hashes[name] = {}
        self._hashes[name][key] = value
        return 1

    def hget(self, name: str, key: str) -> Any:
        return self._hashes.get(name, {}).get(key)

    def hgetall(self, name: str) -> Dict[str, str]:
        return self._hashes.get(name, {})

    def hdel(self, name: str, *keys: str) -> int:
        count = 0
        if name in self._hashes:
            for k in keys:
                if k in self._hashes[name]:
                    del self._hashes[name][k]
                    count += 1
        return count

    def set(self, key: str, value: str, ex: int = None) -> bool:
        self._kvs[key] = value
        return True

    def get(self, key: str) -> Any:
        return self._kvs.get(key)

    def ping(self) -> bool:
        return True


_redis_client = None


def get_redis():
    global _redis_client
    if _redis_client is not None:
        return _redis_client
        
    try:
        # Try to connect to Redis
        client = redis.Redis.from_url(
            settings.REDIS_URL, 
            decode_responses=True, 
            socket_connect_timeout=2
        )
        client.ping()
        _redis_client = client
        logger.info("Connected to Redis server successfully.")
    except Exception as e:
        logger.warning(f"Failed to connect to Redis at {settings.REDIS_URL} ({e}). Falling back to MockRedis.")
        _redis_client = MockRedis()
        
    return _redis_client
