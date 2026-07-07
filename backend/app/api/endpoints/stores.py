from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api import deps
from app.models.postgres import User, Store, Shelf
from app.schemas.store import (
    StoreCreate, StoreResponse,
    ShelfCreate, ShelfResponse,
    StoreLayoutContract, StoreZoneContract
)

# Legacy router (mounted at /api/v1/stores)
router = APIRouter()

# API Contract router (mounted at /api/stores)
contract_router = APIRouter()


# ----------------- Store Contract Schemas -----------------
class StoreContractCreate(BaseModel):
    name: str
    location: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class ShelfContractCreate(BaseModel):
    shelf_name: str
    zone_coordinates: List[List[float]]


# ----------------- API Contract Router (/api/stores) -----------------

@contract_router.post("/", response_model=StoreLayoutContract)
def create_store_contract(
    store_in: StoreContractCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker(["SuperAdmin", "StoreManager"]))
):
    store = db.query(Store).filter(Store.name == store_in.name).first()
    if store:
        raise HTTPException(status_code=400, detail="Store with this name already exists")
    
    db_store = Store(
        name=store_in.name,
        address="",
        location=store_in.location,
        store_metadata=store_in.metadata,
        floor_plan_url=""
    )
    db.add(db_store)
    db.commit()
    db.refresh(db_store)
    
    return StoreLayoutContract(
        layout_id=db_store.id,
        name=db_store.name,
        zones=[]
    )

@contract_router.get("/", response_model=List[StoreLayoutContract])
def list_stores_contract(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    stores = db.query(Store).all()
    out = []
    for s in stores:
        zones = [
            StoreZoneContract(
                zone_id=sh.id,
                name=sh.shelf_name,
                coordinates=sh.zone_coordinates
            ) for sh in s.shelves
        ]
        out.append(StoreLayoutContract(
            layout_id=s.id,
            name=s.name,
            zones=zones
        ))
    return out

@contract_router.post("/{storeId}/shelves")
def create_shelf_contract(
    storeId: str,
    shelf_in: ShelfContractCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker(["SuperAdmin", "StoreManager"]))
):
    # Verify store exists
    store = db.query(Store).filter(Store.id == storeId).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
        
    db_shelf = Shelf(
        store_id=storeId,
        shelf_name=shelf_in.shelf_name,
        zone_coordinates=shelf_in.zone_coordinates,
        name=shelf_in.shelf_name
    )
    db.add(db_shelf)
    db.commit()
    db.refresh(db_shelf)
    
    return {
        "id": db_shelf.id,
        "store_id": db_shelf.store_id,
        "shelf_name": db_shelf.shelf_name,
        "zone_coordinates": db_shelf.zone_coordinates
    }

@contract_router.get("/{storeId}/shelves")
def list_shelves_contract(
    storeId: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    # Verify store exists
    store = db.query(Store).filter(Store.id == storeId).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
        
    shelves = db.query(Shelf).filter(Shelf.store_id == storeId).all()
    return [
        {
            "id": sh.id,
            "store_id": sh.store_id,
            "shelf_name": sh.shelf_name,
            "zone_coordinates": sh.zone_coordinates
        } for sh in shelves
    ]


# ----------------- Legacy Router (/api/v1/stores) -----------------

@router.post("/", response_model=StoreResponse)
def create_store(
    store_in: StoreCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker(["SuperAdmin", "StoreManager"]))
):
    store = db.query(Store).filter(Store.name == store_in.name).first()
    if store:
        raise HTTPException(status_code=400, detail="Store with this name already exists")
    
    db_store = Store(
        name=store_in.name,
        address=store_in.address,
        location=store_in.location,
        store_metadata=store_in.store_metadata,
        floor_plan_url=store_in.floor_plan_url
    )
    db.add(db_store)
    db.commit()
    db.refresh(db_store)
    return db_store

@router.get("/", response_model=List[StoreResponse])
def list_stores(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    return db.query(Store).all()

@router.get("/{store_id}", response_model=StoreResponse)
def get_store(
    store_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return store

@router.delete("/{store_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_store(
    store_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker(["SuperAdmin"]))
):
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    db.delete(store)
    db.commit()
    return None


# ----------------- Shelf CRUD -----------------
@router.post("/shelves", response_model=ShelfResponse)
def create_shelf(
    shelf_in: ShelfCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker(["SuperAdmin", "StoreManager"]))
):
    store = db.query(Store).filter(Store.id == shelf_in.store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
        
    db_shelf = Shelf(**shelf_in.model_dump())
    db.add(db_shelf)
    db.commit()
    db.refresh(db_shelf)
    return db_shelf

@router.get("/shelves/{shelf_id}", response_model=ShelfResponse)
def get_shelf(
    shelf_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    shelf = db.query(Shelf).filter(Shelf.id == shelf_id).first()
    if not shelf:
        raise HTTPException(status_code=404, detail="Shelf not found")
    return shelf
