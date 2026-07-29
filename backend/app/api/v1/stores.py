from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...schemas.store import Store, StoreCreate, StoreUpdate
from ...services.store_service import StoreService
from ...schemas.shelf import Shelf, ShelfCreate, ShelfUpdate
from ...services.shelf_service import ShelfService
from ...schemas.zone import Zone, ZoneCreate, ZoneUpdate
from ...services.zone_service import ZoneService
from ...schemas.camera import Camera, CameraCreate, CameraUpdate
from ...services.camera_service import CameraService
from ..deps import get_current_user
from ...schemas.user import User

router = APIRouter(prefix="/stores", tags=["stores"])


@router.get("", response_model=List[Store])
def get_stores(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return StoreService.get_stores(db, skip=skip, limit=limit)


@router.post("", response_model=Store, status_code=status.HTTP_201_CREATED)
def create_store(
    store: StoreCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return StoreService.create_store(db=db, store=store)


@router.get("/{store_id}", response_model=Store)
def get_store(
    store_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_store = StoreService.get_store(db, store_id=store_id)
    if db_store is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store not found"
        )
    return db_store


@router.put("/{store_id}", response_model=Store)
def update_store(
    store_id: int,
    store: StoreUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_store = StoreService.update_store(db, store_id=store_id, store_update=store)
    if db_store is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store not found"
        )
    return db_store


@router.delete("/{store_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_store(
    store_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    success = StoreService.delete_store(db, store_id=store_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store not found"
        )


# Shelves endpoints
@router.get("/{store_id}/shelves", response_model=List[Shelf])
def get_shelves_by_store(
    store_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ShelfService.get_shelves_by_store(db, store_id=store_id, skip=skip, limit=limit)


@router.post("/{store_id}/shelves", response_model=Shelf, status_code=status.HTTP_201_CREATED)
def create_shelf_for_store(
    store_id: int,
    shelf: ShelfCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    shelf.store_id = store_id
    return ShelfService.create_shelf(db=db, shelf=shelf)


@router.get("/{store_id}/shelves/{shelf_id}", response_model=Shelf)
def get_shelf(
    store_id: int,
    shelf_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_shelf = ShelfService.get_shelf(db, shelf_id=shelf_id)
    if db_shelf is None or db_shelf.store_id != store_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shelf not found"
        )
    return db_shelf


@router.put("/{store_id}/shelves/{shelf_id}", response_model=Shelf)
def update_shelf(
    store_id: int,
    shelf_id: int,
    shelf: ShelfUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_shelf = ShelfService.get_shelf(db, shelf_id=shelf_id)
    if db_shelf is None or db_shelf.store_id != store_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shelf not found"
        )
    return ShelfService.update_shelf(db, shelf_id=shelf_id, shelf_update=shelf)


@router.delete("/{store_id}/shelves/{shelf_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shelf(
    store_id: int,
    shelf_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_shelf = ShelfService.get_shelf(db, shelf_id=shelf_id)
    if db_shelf is None or db_shelf.store_id != store_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shelf not found"
        )
    ShelfService.delete_shelf(db, shelf_id=shelf_id)


# Zones endpoints
@router.get("/{store_id}/zones", response_model=List[Zone])
def get_zones_by_store(
    store_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ZoneService.get_zones_by_store(db, store_id=store_id, skip=skip, limit=limit)


@router.post("/{store_id}/zones", response_model=Zone, status_code=status.HTTP_201_CREATED)
def create_zone_for_store(
    store_id: int,
    zone: ZoneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    zone.store_id = store_id
    return ZoneService.create_zone(db=db, zone=zone)


@router.get("/{store_id}/zones/{zone_id}", response_model=Zone)
def get_zone(
    store_id: int,
    zone_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_zone = ZoneService.get_zone(db, zone_id=zone_id)
    if db_zone is None or db_zone.store_id != store_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Zone not found"
        )
    return db_zone


@router.put("/{store_id}/zones/{zone_id}", response_model=Zone)
def update_zone(
    store_id: int,
    zone_id: int,
    zone: ZoneUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_zone = ZoneService.get_zone(db, zone_id=zone_id)
    if db_zone is None or db_zone.store_id != store_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Zone not found"
        )
    return ZoneService.update_zone(db, zone_id=zone_id, zone_update=zone)


@router.delete("/{store_id}/zones/{zone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_zone(
    store_id: int,
    zone_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_zone = ZoneService.get_zone(db, zone_id=zone_id)
    if db_zone is None or db_zone.store_id != store_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Zone not found"
        )
    ZoneService.delete_zone(db, zone_id=zone_id)


# Cameras endpoints
@router.get("/{store_id}/cameras", response_model=List[Camera])
def get_cameras_by_store(
    store_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return CameraService.get_cameras_by_store(db, store_id=store_id, skip=skip, limit=limit)


@router.post("/{store_id}/cameras", response_model=Camera, status_code=status.HTTP_201_CREATED)
def create_camera_for_store(
    store_id: int,
    camera: CameraCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    camera.store_id = store_id
    return CameraService.create_camera(db=db, camera=camera)


@router.get("/{store_id}/cameras/{camera_id}", response_model=Camera)
def get_camera(
    store_id: int,
    camera_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_camera = CameraService.get_camera(db, camera_id=camera_id)
    if db_camera is None or db_camera.store_id != store_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camera not found"
        )
    return db_camera


@router.put("/{store_id}/cameras/{camera_id}", response_model=Camera)
def update_camera(
    store_id: int,
    camera_id: int,
    camera: CameraUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_camera = CameraService.get_camera(db, camera_id=camera_id)
    if db_camera is None or db_camera.store_id != store_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camera not found"
        )
    return CameraService.update_camera(db, camera_id=camera_id, camera_update=camera)


@router.delete("/{store_id}/cameras/{camera_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_camera(
    store_id: int,
    camera_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_camera = CameraService.get_camera(db, camera_id=camera_id)
    if db_camera is None or db_camera.store_id != store_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camera not found"
        )
    CameraService.delete_camera(db, camera_id=camera_id)

