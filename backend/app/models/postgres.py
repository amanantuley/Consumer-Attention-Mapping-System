import enum
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Integer, Float, Boolean, DateTime, ForeignKey, Enum, JSON, Table, Column
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

class UserRole(str, enum.Enum):
    ADMINISTRATOR = "administrator"
    STORE_MANAGER = "store_manager"
    RETAIL_ANALYST = "retail_analyst"
    MARKETING_MANAGER = "marketing_manager"

class CameraStatus(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    ERROR = "error"

class CameraType(str, enum.Enum):
    OVERHEAD = "overhead"
    SHELF_FACING = "shelf_facing"

class ZoneType(str, enum.Enum):
    ENTRANCE = "entrance"
    EXIT = "exit"
    SHELF_AREA = "shelf_area"
    CHECKOUT = "checkout"
    WALKWAY = "walkway"

class InteractionType(str, enum.Enum):
    PICKUP = "pickup"
    RETURN = "return"
    PURCHASE = "purchase"

class RecommendationType(str, enum.Enum):
    SHELF_POSITIONING = "shelf_positioning"
    TRAFFIC_FLOW = "traffic_flow"
    PROMOTION_PLACEMENT = "promotion_placement"

class User(Base):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.RETAIL_ANALYST, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    audit_logs: Mapped[List["AuditLog"]] = relationship(back_populates="user")

class Store(Base):
    __tablename__ = "stores"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    address: Mapped[str] = mapped_column(String(255), nullable=False)
    floor_plan_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    zones: Mapped[List["StoreZone"]] = relationship(back_populates="store", cascade="all, delete-orphan")
    cameras: Mapped[List["Camera"]] = relationship(back_populates="store", cascade="all, delete-orphan")
    sessions: Mapped[List["ShopperSession"]] = relationship(back_populates="store", cascade="all, delete-orphan")
    recommendations: Mapped[List["LayoutRecommendation"]] = relationship(back_populates="store", cascade="all, delete-orphan")

class StoreZone(Base):
    __tablename__ = "store_zones"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    store_id: Mapped[int] = mapped_column(Integer, ForeignKey("stores.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    zone_type: Mapped[ZoneType] = mapped_column(Enum(ZoneType), nullable=False)
    coordinates: Mapped[dict] = mapped_column(JSON, nullable=False)  # {"points": [[x1,y1], [x2,y2], ...]}
    traffic_density: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    store: Mapped["Store"] = relationship(back_populates="zones")
    shelves: Mapped[List["Shelf"]] = relationship(back_populates="zone", cascade="all, delete-orphan")

class Shelf(Base):
    __tablename__ = "shelves"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    zone_id: Mapped[int] = mapped_column(Integer, ForeignKey("store_zones.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    position_x: Mapped[float] = mapped_column(Float, nullable=False)  # Relative position coordinate
    position_y: Mapped[float] = mapped_column(Float, nullable=False)
    position_z: Mapped[float] = mapped_column(Float, nullable=False)
    width: Mapped[float] = mapped_column(Float, nullable=False)
    height: Mapped[float] = mapped_column(Float, nullable=False)
    depth: Mapped[float] = mapped_column(Float, nullable=False)
    camera_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("cameras.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    zone: Mapped["StoreZone"] = relationship(back_populates="shelves")
    camera: Mapped[Optional["Camera"]] = relationship(foreign_keys=[camera_id])
    shelf_products: Mapped[List["ShelfProduct"]] = relationship(back_populates="shelf", cascade="all, delete-orphan")
    interactions: Mapped[List["ProductInteraction"]] = relationship(back_populates="shelf")

class Product(Base):
    __tablename__ = "products"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sku: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    weight: Mapped[float] = mapped_column(Float, nullable=True)
    dimensions: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # {"w": 10.0, "h": 20.0, "d": 5.0}
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    shelf_products: Mapped[List["ShelfProduct"]] = relationship(back_populates="product", cascade="all, delete-orphan")
    interactions: Mapped[List["ProductInteraction"]] = relationship(back_populates="product")

class ShelfProduct(Base):
    __tablename__ = "shelf_products"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    shelf_id: Mapped[int] = mapped_column(Integer, ForeignKey("shelves.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id"), nullable=False)
    stock_count: Mapped[int] = mapped_column(Integer, default=0)
    capacity: Mapped[int] = mapped_column(Integer, default=10)
    facing_count: Mapped[int] = mapped_column(Integer, default=2)
    
    shelf: Mapped["Shelf"] = relationship(back_populates="shelf_products")
    product: Mapped["Product"] = relationship(back_populates="shelf_products")

class Camera(Base):
    __tablename__ = "cameras"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    store_id: Mapped[int] = mapped_column(Integer, ForeignKey("stores.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    rtsp_url: Mapped[str] = mapped_column(String(512), nullable=False)
    ip_address: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[CameraStatus] = mapped_column(Enum(CameraStatus), default=CameraStatus.OFFLINE)
    camera_type: Mapped[CameraType] = mapped_column(Enum(CameraType), default=CameraType.OVERHEAD)
    last_ping: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    store: Mapped["Store"] = relationship(back_populates="cameras")

class ShopperSession(Base):
    __tablename__ = "shopper_sessions"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tracking_uuid: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    store_id: Mapped[int] = mapped_column(Integer, ForeignKey("stores.id"), nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    entry_zone_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("store_zones.id"), nullable=True)
    exit_zone_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("store_zones.id"), nullable=True)
    segment: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    store: Mapped["Store"] = relationship(back_populates="sessions")
    interactions: Mapped[List["ProductInteraction"]] = relationship(back_populates="session", cascade="all, delete-orphan")

class ProductInteraction(Base):
    __tablename__ = "product_interactions"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(Integer, ForeignKey("shopper_sessions.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id"), nullable=False)
    shelf_id: Mapped[int] = mapped_column(Integer, ForeignKey("shelves.id"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    interaction_type: Mapped[InteractionType] = mapped_column(Enum(InteractionType), nullable=False)
    duration_seconds: Mapped[float] = mapped_column(Float, default=0.0)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    
    session: Mapped["ShopperSession"] = relationship(back_populates="interactions")
    product: Mapped["Product"] = relationship(back_populates="interactions")
    shelf: Mapped["Shelf"] = relationship(back_populates="interactions")

class LayoutRecommendation(Base):
    __tablename__ = "layout_recommendations"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    store_id: Mapped[int] = mapped_column(Integer, ForeignKey("stores.id"), nullable=False)
    recommendation_type: Mapped[RecommendationType] = mapped_column(Enum(RecommendationType), nullable=False)
    details: Mapped[dict] = mapped_column(JSON, nullable=False)  # {"description": "...", "actionable_steps": [...]}
    potential_revenue_impact: Mapped[float] = mapped_column(Float, default=0.0)
    is_applied: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    store: Mapped["Store"] = relationship(back_populates="recommendations")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    target_table: Mapped[str] = mapped_column(String(100), nullable=False)
    target_id: Mapped[int] = mapped_column(Integer, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ip_address: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    user: Mapped["User"] = relationship(back_populates="audit_logs")
