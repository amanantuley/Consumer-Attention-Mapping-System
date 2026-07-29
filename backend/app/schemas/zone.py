from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List


class ZoneBase(BaseModel):
    name: str
    coordinates: List[List[float]]


class ZoneCreate(ZoneBase):
    store_id: Optional[int] = None


class ZoneUpdate(ZoneBase):
    pass


class Zone(ZoneBase):
    id: int
    store_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
