from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class GazeTelemetry(BaseModel):
    session_uuid: str = Field(..., index=True)
    camera_id: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    gaze_vector: List[float] = Field(..., description="[x, y, z] gaze direction vector")
    head_pose: Dict[str, float] = Field(..., description="{'yaw': f, 'pitch': f, 'roll': f}")
    focus_duration: float = Field(..., description="Time spent looking at current target in seconds")
    target_type: str = Field(..., description="e.g. product, shelf, empty")
    target_id: Optional[int] = None

class ShopperMovement(BaseModel):
    session_uuid: str = Field(..., index=True)
    store_id: int = Field(..., index=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    x: float = Field(..., description="Relative physical x coordinate")
    y: float = Field(..., description="Relative physical y coordinate")
    velocity: float = Field(default=0.0)

class HeatmapGridCell(BaseModel):
    grid_x: int
    grid_y: int
    count: int
    duration_seconds: float

class SpatialHeatmap(BaseModel):
    store_id: int = Field(..., index=True)
    heatmap_type: str = Field(..., description="e.g. store_floor, shelf_attention")
    target_id: Optional[int] = Field(None, description="Shelf ID or Zone ID if applicable")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    resolution_x: int = Field(default=100)
    resolution_y: int = Field(default=100)
    cells: List[HeatmapGridCell] = Field(default_factory=list)
