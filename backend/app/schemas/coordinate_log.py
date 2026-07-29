from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class CoordinateLogBase(BaseModel):
    store_id: int
    camera_id: int
    shopper_id: str
    x_coord: float
    y_coord: float
    zone: str


class CoordinateLogCreate(CoordinateLogBase):
    pass


class CoordinateLog(CoordinateLogBase):
    id: int
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
