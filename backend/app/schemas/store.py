from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class StoreBase(BaseModel):
    name: str
    location: Optional[str] = None


class StoreCreate(StoreBase):
    pass


class StoreUpdate(StoreBase):
    pass


class Store(StoreBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

