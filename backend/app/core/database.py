from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from pymongo import MongoClient
import redis
from app.core.config import settings

# SQLite/PostgreSQL Engine Router
if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Mock MongoDB fallback for offline host runs
class MockCollection:
    def insert_one(self, data):
        return None
    def find(self, *args, **kwargs):
        return []

class MockMongoDB:
    def __getattr__(self, name):
        return MockCollection()

try:
    mongo_client = MongoClient(settings.MONGO_URL, serverSelectionTimeoutMS=1000)
    # Check connection
    mongo_client.admin.command('ping')
    mongo_db = mongo_client[settings.MONGO_DB_NAME]
    print("Connected to MongoDB successfully.")
except Exception:
    print("MongoDB offline. Falling back to Mock DB.")
    mongo_db = MockMongoDB()

def get_mongo_db():
    return mongo_db

# Mock Redis fallback
class MockPubSub:
    def subscribe(self, *args, **kwargs): pass
    def get_message(self, *args, **kwargs): return None
    def unsubscribe(self, *args, **kwargs): pass
    def close(self, *args, **kwargs): pass

class MockRedis:
    def publish(self, *args, **kwargs): return 0
    def ping(self): return True
    def pubsub(self, *args, **kwargs): return MockPubSub()

try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True, socket_connect_timeout=1)
    redis_client.ping()
    print("Connected to Redis successfully.")
except Exception:
    print("Redis offline. Falling back to Mock Client.")
    redis_client = MockRedis()

def get_redis_client():
    return redis_client
