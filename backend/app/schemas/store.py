from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

# Shelf Schemas
class ShelfBase(BaseModel):
    shelf_name: str
    zone_coordinates: Optional[List[List[float]]] = None
    name: Optional[str] = None
    position_x: float = 0.0
    position_y: float = 0.0
    position_z: float = 0.0
    width: float = 0.0
    height: float = 0.0
    depth: float = 0.0

class ShelfCreate(ShelfBase):
    store_id: str
    zone_id: Optional[int] = None
    camera_id: Optional[int] = None

class ShelfResponse(ShelfBase):
    id: str
    store_id: str
    zone_id: Optional[int] = None
    camera_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Store Schemas
class StoreBase(BaseModel):
    name: str
    address: str = ""
    location: Optional[str] = None
    store_metadata: Optional[Dict[str, Any]] = None
    floor_plan_url: Optional[str] = None

class StoreCreate(StoreBase):
    pass

class StoreResponse(StoreBase):
    id: str
    created_at: datetime
    shelves: List[ShelfResponse] = []

    class Config:
        from_attributes = True

# Store Layout Contract schema (matching API contract exactly)
class StoreZoneContract(BaseModel):
    zone_id: str
    name: str
    coordinates: Optional[List[List[float]]] = None

class StoreLayoutContract(BaseModel):
    layout_id: str
    name: str
    zones: List[StoreZoneContract] = []


