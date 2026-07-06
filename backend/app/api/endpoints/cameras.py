import os
import shutil
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.api import deps
from app.core.config import settings
from app.models.postgres import User, UserRole, Camera, CameraStatus, Store
from app.schemas.store import CameraCreate, CameraResponse

router = APIRouter()

@router.post("/", response_model=CameraResponse)
def register_camera(
    cam_in: CameraCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMINISTRATOR, UserRole.STORE_MANAGER]))
):
    store = db.query(Store).filter(Store.id == cam_in.store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
        
    db_cam = Camera(
        store_id=cam_in.store_id,
        name=cam_in.name,
        rtsp_url=cam_in.rtsp_url,
        ip_address=cam_in.ip_address,
        camera_type=cam_in.camera_type,
        status=CameraStatus.OFFLINE,
        last_ping=None
    )
    db.add(db_cam)
    db.commit()
    db.refresh(db_cam)
    return db_cam

@router.get("/", response_model=List[CameraResponse])
def list_cameras(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    return db.query(Camera).all()

@router.get("/{camera_id}", response_model=CameraResponse)
def get_camera(
    camera_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    cam = db.query(Camera).filter(Camera.id == camera_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    return cam

@router.post("/{camera_id}/ping", response_model=CameraResponse)
def ping_camera(
    camera_id: int,
    camera_status: CameraStatus,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMINISTRATOR, UserRole.STORE_MANAGER]))
):
    cam = db.query(Camera).filter(Camera.id == camera_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
        
    cam.status = camera_status
    cam.last_ping = datetime.utcnow()
    db.commit()
    db.refresh(cam)
    return cam

@router.post("/{camera_id}/upload-video")
def upload_recorded_video(
    camera_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMINISTRATOR, UserRole.STORE_MANAGER]))
):
    cam = db.query(Camera).filter(Camera.id == camera_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
        
    if not file.filename.lower().endswith(('.mp4', '.avi', '.mov', '.mkv')):
        raise HTTPException(status_code=400, detail="Invalid video file format")
        
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"cam_{camera_id}_{int(datetime.utcnow().timestamp())}{file_extension}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Trigger offline processing task using Celery
    from app.core.celery_worker import process_video_task
    task = process_video_task.delay(camera_id, file_path)
    
    return {
        "status": "success",
        "message": "Video uploaded successfully. Offline processing scheduled.",
        "file_path": file_path,
        "task_id": task.id
    }
