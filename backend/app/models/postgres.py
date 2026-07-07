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
    zone_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
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
