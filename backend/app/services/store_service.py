from typing import List, Optional
from sqlalchemy.orm import Session
from ..models.store import Store
from ..schemas.store import StoreCreate, StoreUpdate


class StoreService:
    @staticmethod
    def get_store(db: Session, store_id: int) -> Optional[Store]:
        return db.query(Store).filter(Store.id == store_id).first()

    @staticmethod
    def get_stores(db: Session, skip: int = 0, limit: int = 100) -> List[Store]:
        return db.query(Store).offset(skip).limit(limit).all()

    @staticmethod
    def create_store(db: Session, store: StoreCreate) -> Store:
        db_store = Store(name=store.name, location=store.location)
        db.add(db_store)
        db.commit()
        db.refresh(db_store)
        return db_store

    @staticmethod
    def update_store(db: Session, store_id: int, store_update: StoreUpdate) -> Optional[Store]:
        db_store = StoreService.get_store(db, store_id)
        if not db_store:
            return None
        update_data = store_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_store, key, value)
        db.commit()
        db.refresh(db_store)
        return db_store

    @staticmethod
    def delete_store(db: Session, store_id: int) -> bool:
        db_store = StoreService.get_store(db, store_id)
        if not db_store:
            return False
        db.delete(db_store)
        db.commit()
        return True
