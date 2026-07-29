from typing import List, Optional
from sqlalchemy.orm import Session
from ..models.zone import Zone
from ..schemas.zone import ZoneCreate, ZoneUpdate


class ZoneService:
    @staticmethod
    def get_zone(db: Session, zone_id: int) -> Optional[Zone]:
        return db.query(Zone).filter(Zone.id == zone_id).first()

    @staticmethod
    def get_zones_by_store(db: Session, store_id: int, skip: int = 0, limit: int = 100) -> List[Zone]:
        return db.query(Zone).filter(Zone.store_id == store_id).offset(skip).limit(limit).all()

    @staticmethod
    def create_zone(db: Session, zone: ZoneCreate) -> Zone:
        db_zone = Zone(name=zone.name, coordinates=zone.coordinates, store_id=zone.store_id)
        db.add(db_zone)
        db.commit()
        db.refresh(db_zone)
        return db_zone

    @staticmethod
    def update_zone(db: Session, zone_id: int, zone_update: ZoneUpdate) -> Optional[Zone]:
        db_zone = ZoneService.get_zone(db, zone_id)
        if not db_zone:
            return None
        update_data = zone_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_zone, key, value)
        db.commit()
        db.refresh(db_zone)
        return db_zone

    @staticmethod
    def delete_zone(db: Session, zone_id: int) -> bool:
        db_zone = ZoneService.get_zone(db, zone_id)
        if not db_zone:
            return False
        db.delete(db_zone)
        db.commit()
        return True
