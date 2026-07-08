from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import uuid

from app.api import deps
from app.models.postgres import Product, Shelf, ShelfProduct, User

router = APIRouter()

class ProductCreate(BaseModel):
    name: str
    sku: str
    category: str
    price: float
    stock: int = 0

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None

class ProductResponse(BaseModel):
    id: str
    name: str
    sku: str
    category: str
    price: float
    stock: int

    class Config:
        from_attributes = True

class PlacementCreate(BaseModel):
    shelf_id: str
    product_id: str
    quantity: int = 1

class ShelfProductResponse(BaseModel):
    id: str
    shelf_id: str
    product_id: str
    quantity: int
    product: ProductResponse

    class Config:
        from_attributes = True

@router.get("/", response_model=List[ProductResponse])
def list_products(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    products = db.query(Product).all()
    # Seed default products if empty
    if not products:
        default_products = [
            Product(name="Coca-Cola 500ml", sku="COKE-500", category="Beverages", price=1.99, stock=50),
            Product(name="Doritos Nacho Cheese 150g", sku="DORITOS-150", category="Snacks", price=3.49, stock=30),
            Product(name="Whole Milk 1L", sku="MILK-1L", category="Dairy", price=2.29, stock=20),
            Product(name="Tide Liquid Detergent 2L", sku="TIDE-2L", category="Household", price=12.99, stock=15),
        ]
        db.add_all(default_products)
        db.commit()
        products = db.query(Product).all()
    return products

@router.post("/", response_model=ProductResponse)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker(["SuperAdmin", "StoreManager", "Analyst"]))
):
    product = db.query(Product).filter(Product.sku == product_in.sku).first()
    if product:
        raise HTTPException(status_code=400, detail="Product SKU already exists")
        
    db_product = Product(
        name=product_in.name,
        sku=product_in.sku,
        category=product_in.category,
        price=product_in.price,
        stock=product_in.stock
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: str,
    product_in: ProductUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker(["SuperAdmin", "StoreManager", "Analyst"]))
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    if product_in.name is not None:
        product.name = product_in.name
    if product_in.sku is not None:
        # Check if SKU matches another product
        existing = db.query(Product).filter(Product.sku == product_in.sku, Product.id != product_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="SKU already exists on another product")
        product.sku = product_in.sku
    if product_in.category is not None:
        product.category = product_in.category
    if product_in.price is not None:
        product.price = product_in.price
    if product_in.stock is not None:
        product.stock = product_in.stock
        
    db.commit()
    db.refresh(product)
    return product

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker(["SuperAdmin", "StoreManager"]))
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return None

@router.get("/placement", response_model=List[ShelfProductResponse])
def list_placements(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    return db.query(ShelfProduct).all()

@router.post("/placement", response_model=ShelfProductResponse)
def place_product_on_shelf(
    placement_in: PlacementCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker(["SuperAdmin", "StoreManager", "Analyst"]))
):
    # Verify product and shelf exist
    product = db.query(Product).filter(Product.id == placement_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    shelf = db.query(Shelf).filter(Shelf.id == placement_in.shelf_id).first()
    if not shelf:
        raise HTTPException(status_code=404, detail="Shelf not found")
        
    # Check if product is already placed on this shelf
    placement = db.query(ShelfProduct).filter(
        ShelfProduct.shelf_id == placement_in.shelf_id,
        ShelfProduct.product_id == placement_in.product_id
    ).first()
    
    if placement:
        placement.quantity += placement_in.quantity
    else:
        placement = ShelfProduct(
            shelf_id=placement_in.shelf_id,
            product_id=placement_in.product_id,
            quantity=placement_in.quantity
        )
        db.add(placement)
        
    db.commit()
    db.refresh(placement)
    return placement
