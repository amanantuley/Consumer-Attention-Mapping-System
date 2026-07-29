from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.sql import func
from ..core.database import Base


class CoordinateLog(Base):
    __tablename__ = "coordinate_logs"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=False)
    shopper_id = Column(String(100), nullable=False, index=True)
    x_coord = Column(Float, nullable=False)
    y_coord = Column(Float, nullable=False)
    zone = Column(String(100), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
