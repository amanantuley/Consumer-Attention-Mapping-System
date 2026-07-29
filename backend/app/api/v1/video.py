from typing import Optional, List
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...models.camera import Camera
from ...utils.video_stream import VideoStream, verify_stream
from ..deps import get_current_user
from ...schemas.user import User
from ...services.tracking_service import TrackingService

router = APIRouter(prefix="/video", tags=["video"])


class ConnectionManager:
    """
    Manages active WebSocket connections and runs the simulation loop
    on-demand when at least one client is active.
    """
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.sim_task: Optional[asyncio.Task] = None
        self.tracking_sim = TrackingService()

    async def connect(self, websocket: WebSocket, store_id: int):
        await websocket.accept()
        self.active_connections.append(websocket)
        # Start simulation loop if not already running
        if self.sim_task is None or self.sim_task.done():
            self.sim_task = asyncio.create_task(self._simulation_loop(store_id))

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        # Cancel simulation loop if no active connections remain
        if not self.active_connections and self.sim_task:
            self.sim_task.cancel()
            self.sim_task = None

    async def _simulation_loop(self, store_id: int):
        try:
            while True:
                sim_data = self.tracking_sim.step(store_id)
                await self.broadcast(sim_data)
                await asyncio.sleep(1.0)
        except asyncio.CancelledError:
            pass
        except Exception:
            pass

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass


manager = ConnectionManager()


@router.websocket("/ws/{store_id}")
async def websocket_endpoint(websocket: WebSocket, store_id: int):
    await manager.connect(websocket, store_id)
    try:
        while True:
            # Keep connection open by listening for any client input
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)


@router.get("/stream/{camera_id}")
def stream_video(
    camera_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camera not found"
        )

    if not verify_stream(camera.stream_url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to open video stream"
        )

    stream = VideoStream(camera.stream_url)
    return StreamingResponse(
        stream.gen_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@router.get("/verify/{camera_id}")
def verify_camera_stream(
    camera_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camera not found"
        )
    success = verify_stream(camera.stream_url)
    return {"camera_id": camera_id, "stream_url": camera.stream_url, "valid": success}


