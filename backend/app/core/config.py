import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "Consumer Attention Mapping System (CAMS)"
    API_V1_STR: str = "/api/v1"
    
    # Databases
    DATABASE_URL: str = Field(
        default="sqlite:///./cams.db"
    )
    MONGO_URL: str = Field(
        default="mongodb://localhost:27017"
    )
    MONGO_DB_NAME: str = "cams_telemetry"
    
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0"
    )
    
    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str = Field(
        default="localhost:9092"
    )
    KAFKA_TELEMETRY_TOPIC: str = "cams.shopper.telemetry"
    KAFKA_ALERT_TOPIC: str = "cams.system.alerts"
    
    # Security
    JWT_SECRET: str = Field(
        default="cams-super-secret-key-change-in-production-12345"
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    
    # Camera / Storage
    UPLOAD_DIR: str = "static/uploads"
    MODEL_CACHE_DIR: str = "static/models"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.MODEL_CACHE_DIR, exist_ok=True)
