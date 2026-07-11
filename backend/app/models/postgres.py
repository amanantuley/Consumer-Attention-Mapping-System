import enum
import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Integer, Float, Boolean, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

class UserRole(str, enum.Enum):
    SUPERADMIN = "SuperAdmin"
    STORE_MANAGER = "StoreManager"
    ANALYST = "Analyst"
    # Legacy roles for compatibility
    ADMINISTRATOR = "administrator"
    STORE_MANAGER_LEGACY = "store_manager"
    RETAIL_ANALYST = "retail_analyst"
    MARKETING_MANAGER = "marketing_manager"

class Role(Base):
    __tablename__ = "roles"
    
    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)

class User(Base):
    __tablename__ = "users"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role_id: Mapped[str] = mapped_column(String(50), ForeignKey("roles.id"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    role: Mapped["Role"] = relationship()

class Store(Base):
    __tablename__ = "stores"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    address: Mapped[str] = mapped_column(String(255), default="")
    floor_plan_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    store_metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    shelves: Mapped[List["Shelf"]] = relationship(back_populates="store", cascade="all, delete-orphan")

class Shelf(Base):
    __tablename__ = "shelves"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    store_id: Mapped[str] = mapped_column(String(36), ForeignKey("stores.id"), nullable=False)
    shelf_name: Mapped[str] = mapped_column(String(255), nullable=False)
    zone_coordinates: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # [[x1, y1], [x2, y2]]
    
    # Optional fields for backward compatibility
    zone_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("store_zones.id"), nullable=True)
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    position_x: Mapped[float] = mapped_column(Float, default=0.0)
    position_y: Mapped[float] = mapped_column(Float, default=0.0)
    position_z: Mapped[float] = mapped_column(Float, default=0.0)
    width: Mapped[float] = mapped_column(Float, default=0.0)
    height: Mapped[float] = mapped_column(Float, default=0.0)
    depth: Mapped[float] = mapped_column(Float, default=0.0)
    camera_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    store: Mapped["Store"] = relationship(back_populates="shelves")
    store_zone: Mapped[Optional["StoreZone"]] = relationship()
    shelf_products: Mapped[List["ShelfProduct"]] = relationship(back_populates="shelf", cascade="all, delete-orphan")

class Camera(Base):
    __tablename__ = "cameras"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    store_id: Mapped[str] = mapped_column(String(36), ForeignKey("stores.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    rtsp_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class StoreZone(Base):
    __tablename__ = "store_zones"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    store_id: Mapped[str] = mapped_column(String(36), ForeignKey("stores.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    coordinates: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Product(Base):
    __tablename__ = "products"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sku: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    stock: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class ShelfProduct(Base):
    __tablename__ = "shelf_products"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    shelf_id: Mapped[str] = mapped_column(String(36), ForeignKey("shelves.id"), nullable=False)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("products.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    
    shelf: Mapped["Shelf"] = relationship(back_populates="shelf_products")
    product: Mapped["Product"] = relationship()

class ShopperSession(Base):
    __tablename__ = "shopper_sessions"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    tracking_uuid: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    store_id: Mapped[str] = mapped_column(String(36), ForeignKey("stores.id"), nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    segment: Mapped[str] = mapped_column(String(100), default="Regular")

class InteractionType(str, enum.Enum):
    PICKUP = "pickup"
    RETURN = "return"
    PURCHASE = "purchase"
    GAZE = "gaze"

class ProductInteraction(Base):
    __tablename__ = "product_interactions"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("shopper_sessions.id"), nullable=False)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("products.id"), nullable=False)
    shelf_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("shelves.id"), nullable=True)
    interaction_type: Mapped[str] = mapped_column(String(50), nullable=False)  # "gaze", "picked_up", "returned", "purchase"
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    duration_seconds: Mapped[float] = mapped_column(Float, default=0.0)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class RecommendationType(str, enum.Enum):
    SHELF_POSITIONING = "shelf_positioning"
    TRAFFIC_FLOW = "traffic_flow"
    PROMOTIONAL_PLACEMENT = "promotional_placement"

class LayoutRecommendation(Base):
    __tablename__ = "layout_recommendations"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    store_id: Mapped[str] = mapped_column(String(36), ForeignKey("stores.id"), nullable=False)
    recommendation_type: Mapped[RecommendationType] = mapped_column(Enum(RecommendationType), nullable=False)
    details: Mapped[dict] = mapped_column(JSON, nullable=False)
    potential_revenue_impact: Mapped[float] = mapped_column(Float, default=0.0)
    is_applied: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

