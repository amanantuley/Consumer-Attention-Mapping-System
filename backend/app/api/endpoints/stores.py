from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.postgres import User, UserRole, Store, StoreZone, Shelf, Product, ShelfProduct, Camera
from app.schemas.store import (
    StoreCreate, StoreResponse, StoreZoneCreate, StoreZoneResponse,
    ShelfCreate, ShelfResponse, ProductCreate, ProductResponse, ShelfProductCreate, ShelfProductResponse
)

router = APIRouter()

# ----------------- Store CRUD -----------------
@router.post("/", response_model=StoreResponse)
def create_store(
    store_in: StoreCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMINISTRATOR, UserRole.STORE_MANAGER]))
):
    store = db.query(Store).filter(Store.name == store_in.name).first()
    if store:
        raise HTTPException(status_code=400, detail="Store with this name already exists")
    db_store = Store(**store_in.model_dump())
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
    store_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return store

@router.delete("/{store_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_store(
    store_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMINISTRATOR]))
):
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    db.delete(store)
    db.commit()
    return None


# ----------------- Zone CRUD -----------------
@router.post("/zones", response_model=StoreZoneResponse)
def create_zone(
    zone_in: StoreZoneCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMINISTRATOR, UserRole.STORE_MANAGER]))
):
    # Verify store exists
    store = db.query(Store).filter(Store.id == zone_in.store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    db_zone = StoreZone(**zone_in.model_dump())
    db.add(db_zone)
    db.commit()
    db.refresh(db_zone)
    return db_zone

@router.get("/{store_id}/zones", response_model=List[StoreZoneResponse])
def list_zones_by_store(
    store_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    return db.query(StoreZone).filter(StoreZone.store_id == store_id).all()


# ----------------- Shelf CRUD -----------------
@router.post("/shelves", response_model=ShelfResponse)
def create_shelf(
    shelf_in: ShelfCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMINISTRATOR, UserRole.STORE_MANAGER]))
):
    zone = db.query(StoreZone).filter(StoreZone.id == shelf_in.zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Store Zone not found")
    
    if shelf_in.camera_id:
        cam = db.query(Camera).filter(Camera.id == shelf_in.camera_id).first()
        if not cam:
            raise HTTPException(status_code=404, detail="Camera not found")

    db_shelf = Shelf(**shelf_in.model_dump())
    db.add(db_shelf)
    db.commit()
    db.refresh(db_shelf)
    return db_shelf

@router.get("/shelves/{shelf_id}", response_model=ShelfResponse)
def get_shelf(
    shelf_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    shelf = db.query(Shelf).filter(Shelf.id == shelf_id).first()
    if not shelf:
        raise HTTPException(status_code=404, detail="Shelf not found")
    return shelf


# ----------------- Product CRUD -----------------
@router.post("/products", response_model=ProductResponse)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMINISTRATOR, UserRole.STORE_MANAGER]))
):
    product = db.query(Product).filter(Product.sku == product_in.sku).first()
    if product:
        raise HTTPException(status_code=400, detail="SKU already exists")
    db_product = Product(**product_in.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.get("/products", response_model=List[ProductResponse])
def list_products(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    return db.query(Product).all()

@router.post("/shelves/{shelf_id}/products", response_model=ShelfProductResponse)
def assign_product_to_shelf(
    shelf_id: int,
    shelf_prod_in: ShelfProductCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker([UserRole.ADMINISTRATOR, UserRole.STORE_MANAGER]))
):
    shelf = db.query(Shelf).filter(Shelf.id == shelf_id).first()
    if not shelf:
        raise HTTPException(status_code=404, detail="Shelf not found")
    
    prod = db.query(Product).filter(Product.id == shelf_prod_in.product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
        
    db_sp = ShelfProduct(
        shelf_id=shelf_id,
        product_id=shelf_prod_in.product_id,
        stock_count=shelf_prod_in.stock_count,
        capacity=shelf_prod_in.capacity,
        facing_count=shelf_prod_in.facing_count
    )
    db.add(db_sp)
    db.commit()
    db.refresh(db_sp)
    return db_sp
