from typing import List, Optional
from sqlalchemy.orm import Session
from ..models.camera import Camera
from ..schemas.camera import CameraCreate, CameraUpdate


class CameraService:
    @staticmethod
    def get_camera(db: Session, camera_id: int) -> Optional[Camera]:
        return db.query(Camera).filter(Camera.id == camera_id).first()

    @staticmethod
    def get_cameras_by_store(db: Session, store_id: int, skip: int = 0, limit: int = 100) -> List[Camera]:
        return db.query(Camera).filter(Camera.store_id == store_id).offset(skip).limit(limit).all()

    @staticmethod
    def create_camera(db: Session, camera: CameraCreate) -> Camera:
        db_camera = Camera(
            name=camera.name,
            stream_url=camera.stream_url,
            description=camera.description,
            store_id=camera.store_id,
        )
        db.add(db_camera)
        db.commit()
        db.refresh(db_camera)
        return db_camera

    @staticmethod
    def update_camera(db: Session, camera_id: int, camera_update: CameraUpdate) -> Optional[Camera]:
        db_camera = CameraService.get_camera(db, camera_id)
        if not db_camera:
            return None
        update_data = camera_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_camera, key, value)
        db.commit()
        db.refresh(db_camera)
        return db_camera

    @staticmethod
    def delete_camera(db: Session, camera_id: int) -> bool:
        db_camera = CameraService.get_camera(db, camera_id)
        if not db_camera:
            return False
        db.delete(db_camera)
        db.commit()
        return True
