from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class AnalyticsSummary(BaseModel):
    store_id: int
    total_shoppers: int
    total_records: int
    total_zones: int
    average_dwell_seconds: float
    top_zone: str
    recommendations_count: int

    model_config = ConfigDict(from_attributes=True)


class ZoneDwell(BaseModel):
    zone: str
    total_dwell_seconds: float
    average_dwell_seconds: float
    unique_shoppers: int

    model_config = ConfigDict(from_attributes=True)


class JourneyPoint(BaseModel):
    x: float
    y: float
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class Trajectory(BaseModel):
    shopper_id: str
    path: List[JourneyPoint]

    model_config = ConfigDict(from_attributes=True)


class AttractivenessZone(BaseModel):
    zone: str
    traffic_score: int
    dwell_score: float
    interaction_count: int
    attractiveness_score: float

    model_config = ConfigDict(from_attributes=True)


class RecommendationItem(BaseModel):
    zone: str
    issue: str
    action: str
    confidence: float

    model_config = ConfigDict(from_attributes=True)


class HeatmapPoint(BaseModel):
    x: int
    y: int
    count: int

    model_config = ConfigDict(from_attributes=True)


class StoreOccupancy(BaseModel):
    store_id: int
    occupancy: int

    model_config = ConfigDict(from_attributes=True)
