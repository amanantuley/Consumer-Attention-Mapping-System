from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # PostgreSQL
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "chanduS@02"
    POSTGRES_DB: str = "consumer_attention"
    POSTGRES_PORT: int = 5432

    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB: str = "ai_consumer_attention"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()

