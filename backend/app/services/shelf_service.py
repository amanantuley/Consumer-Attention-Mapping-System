from typing import List, Optional
from sqlalchemy.orm import Session
from ..models.shelf import Shelf
from ..schemas.shelf import ShelfCreate, ShelfUpdate


class ShelfService:
    @staticmethod
    def get_shelf(db: Session, shelf_id: int) -> Optional[Shelf]:
        return db.query(Shelf).filter(Shelf.id == shelf_id).first()

    @staticmethod
    def get_shelves_by_store(db: Session, store_id: int, skip: int = 0, limit: int = 100) -> List[Shelf]:
        return db.query(Shelf).filter(Shelf.store_id == store_id).offset(skip).limit(limit).all()

    @staticmethod
    def create_shelf(db: Session, shelf: ShelfCreate) -> Shelf:
        db_shelf = Shelf(
            name=shelf.name,
            description=shelf.description,
            store_id=shelf.store_id,
            camera_id=shelf.camera_id,
        )
        db.add(db_shelf)
        db.commit()
        db.refresh(db_shelf)
        return db_shelf

    @staticmethod
    def update_shelf(db: Session, shelf_id: int, shelf_update: ShelfUpdate) -> Optional[Shelf]:
        db_shelf = ShelfService.get_shelf(db, shelf_id)
        if not db_shelf:
            return None
        update_data = shelf_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_shelf, key, value)
        db.commit()
        db.refresh(db_shelf)
        return db_shelf

    @staticmethod
    def delete_shelf(db: Session, shelf_id: int) -> bool:
        db_shelf = ShelfService.get_shelf(db, shelf_id)
        if not db_shelf:
            return False
        db.delete(db_shelf)
        db.commit()
        return True
