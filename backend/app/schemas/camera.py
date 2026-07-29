from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class CameraBase(BaseModel):
    name: str
    stream_url: str
    description: Optional[str] = None


class CameraCreate(CameraBase):
    store_id: Optional[int] = None


class CameraUpdate(CameraBase):
    pass


class Camera(CameraBase):
    id: int
    store_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
