from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from app.models.postgres import UserRole, CameraStatus, CameraType, ZoneType, InteractionType, RecommendationType

# Camera Schemas
class CameraBase(BaseModel):
    name: str
    rtsp_url: str
    ip_address: str
    camera_type: CameraType = CameraType.OVERHEAD

class CameraCreate(CameraBase):
    store_id: int

class CameraResponse(CameraBase):
    id: int
    store_id: int
    status: CameraStatus
    last_ping: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Product Schemas
class ProductBase(BaseModel):
    sku: str
    name: str
    category: str
    price: float
    weight: Optional[float] = None
    dimensions: Optional[Dict[str, float]] = None  # {"w": 10, "h": 20, "d": 5}

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Shelf Product relation
class ShelfProductBase(BaseModel):
    stock_count: int = 0
    capacity: int = 10
    facing_count: int = 2

class ShelfProductCreate(ShelfProductBase):
    product_id: int

class ShelfProductResponse(ShelfProductBase):
    id: int
    shelf_id: int
    product: ProductResponse

    class Config:
        from_attributes = True

# Shelf Schemas
class ShelfBase(BaseModel):
    name: str
    position_x: float
    position_y: float
    position_z: float
    width: float
    height: float
    depth: float

class ShelfCreate(ShelfBase):
    zone_id: int
    camera_id: Optional[int] = None

class ShelfResponse(ShelfBase):
    id: int
    zone_id: int
    camera_id: Optional[int] = None
    shelf_products: List[ShelfProductResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True

# Zone Schemas
class StoreZoneBase(BaseModel):
    name: str
    zone_type: ZoneType
    coordinates: Dict[str, Any]  # {"points": [[x1, y1], ...]}

class StoreZoneCreate(StoreZoneBase):
    store_id: int

class StoreZoneResponse(StoreZoneBase):
    id: int
    store_id: int
    traffic_density: float
    shelves: List[ShelfResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True

# Store Schemas
class StoreBase(BaseModel):
    name: str
    address: str
    floor_plan_url: Optional[str] = None

class StoreCreate(StoreBase):
    pass

class StoreResponse(StoreBase):
    id: int
    created_at: datetime
    zones: List[StoreZoneResponse] = []
    cameras: List[CameraResponse] = []

    class Config:
        from_attributes = True

# Shopper Session & Interaction Schemas
class ProductInteractionBase(BaseModel):
    product_id: int
    shelf_id: int
    interaction_type: InteractionType
    duration_seconds: float = 0.0
    quantity: int = 1

class ProductInteractionResponse(ProductInteractionBase):
    id: int
    session_id: int
    timestamp: datetime
    product: ProductResponse

    class Config:
        from_attributes = True

class ShopperSessionResponse(BaseModel):
    id: int
    tracking_uuid: str
    store_id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    entry_zone_id: Optional[int] = None
    exit_zone_id: Optional[int] = None
    segment: Optional[str] = None
    interactions: List[ProductInteractionResponse] = []

    class Config:
        from_attributes = True

# Layout Recommendations
class LayoutRecommendationResponse(BaseModel):
    id: int
    store_id: int
    recommendation_type: RecommendationType
    details: Dict[str, Any]
    potential_revenue_impact: float
    is_applied: bool
    created_at: datetime

    class Config:
        from_attributes = True
