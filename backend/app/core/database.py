from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from motor.motor_asyncio import AsyncIOMotorClient
from .config import get_settings

settings = get_settings()

# PostgreSQL
SQLALCHEMY_DATABASE_URL = URL.create(
    "postgresql+psycopg",
    username=settings.POSTGRES_USER,
    password=settings.POSTGRES_PASSWORD,
    host=settings.POSTGRES_SERVER,
    port=settings.POSTGRES_PORT,
    database=settings.POSTGRES_DB,
)

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# MongoDB
mongo_client = AsyncIOMotorClient(settings.MONGODB_URL)
mongo_db = mongo_client[settings.MONGODB_DB]

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
