from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class ShelfBase(BaseModel):
    name: str
    description: Optional[str] = None
    camera_id: Optional[int] = None


class ShelfCreate(ShelfBase):
    store_id: Optional[int] = None


class ShelfUpdate(ShelfBase):
    pass


class Shelf(ShelfBase):
    id: int
    store_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
