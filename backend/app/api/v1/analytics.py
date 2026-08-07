from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...core.redis import get_redis
from ...schemas.analytics import (
    AnalyticsSummary,
    ZoneDwell,
    Trajectory,
    AttractivenessZone,
    RecommendationItem,
    HeatmapPoint,
    StoreOccupancy,
)
from ...services.analytics_service import AnalyticsService
from ..deps import get_current_user
from ...schemas.user import User

router = APIRouter(prefix="/stores", tags=["analytics"])


@router.get("/{store_id}/analytics/summary", response_model=AnalyticsSummary)
def get_analytics_summary(
    store_id: int,
    start: Optional[datetime] = Query(None, description="Start time for analytics window"),
    end: Optional[datetime] = Query(None, description="End time for analytics window"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return AnalyticsService.get_summary(db, store_id, start, end)


@router.get("/{store_id}/analytics/dwell", response_model=List[ZoneDwell])
def get_dwell_analytics(
    store_id: int,
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return AnalyticsService.get_dwell_by_zone(db, store_id, start, end)


@router.get("/{store_id}/analytics/traffic", response_model=List[Trajectory])
def get_traffic_analytics(
    store_id: int,
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return AnalyticsService.build_trajectories(db, store_id, start, end)


@router.get("/{store_id}/analytics/attractiveness", response_model=List[AttractivenessZone])
def get_attractiveness_analytics(
    store_id: int,
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return AnalyticsService.get_attractiveness_scores(db, store_id, start, end)


@router.get("/{store_id}/analytics/recommendations", response_model=List[RecommendationItem])
def get_analytics_recommendations(
    store_id: int,
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return AnalyticsService.get_recommendations(db, store_id, start, end)


@router.get("/{store_id}/analytics/occupancy", response_model=StoreOccupancy)
def get_store_occupancy(
    store_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    redis = get_redis()
    occupancy_value = redis.hget("store_occupancy", str(store_id))
    occupancy = int(occupancy_value) if occupancy_value is not None else 0
    return {"store_id": store_id, "occupancy": occupancy}


@router.get("/{store_id}/analytics/heatmap", response_model=List[HeatmapPoint])
def get_heatmap_points(
    store_id: int,
    start: Optional[datetime] = Query(None),
    end: Optional[datetime] = Query(None),
    grid_size: int = Query(32, ge=8, le=128),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return AnalyticsService.get_heatmap_points(db, store_id, start, end, grid_size=grid_size)
