import logging
from app.core.database import SessionLocal
from app.models.postgres import Base, User, Store, Shelf, Role
from app.core.security import get_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cams.seed")

def seed_database():
    from app.core.database import engine
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        logger.info("Starting database seeding...")
        
        # 1. Seed Roles if table is empty
        if db.query(Role).count() == 0:
            logger.info("Seeding Roles table...")
            db.add_all([
                Role(id="SuperAdmin", name="SuperAdmin"),
                Role(id="StoreManager", name="StoreManager"),
                Role(id="Analyst", name="Analyst")
            ])
            db.commit()
            
        # Create Default Admin if missing
        admin = db.query(User).filter(User.email == "admin@cams.com").first()
        if not admin:
            db_admin = User(
                email="admin@cams.com",
                hashed_password=get_password_hash("adminpassword"),
                full_name="System Administrator",
                role_id="SuperAdmin",
                is_active=True
            )
            db.add(db_admin)
            db.commit()
            
        # 2. Create Default Store
        store = db.query(Store).filter(Store.name == "Downtown Retail #1").first()
        if not store:
            store = Store(
                name="Downtown Retail #1",
                address="456 Main St, Metropolis",
                location="Metropolis",
                floor_plan_url="/static/images/floor_plan_1.png",
                store_metadata={"size_sqft": 5000}
            )
            db.add(store)
            db.commit()
            db.refresh(store)
            logger.info("Store created.")
            
        # 3. Create Shelves
        shelves_data = [
            ("Aisle A - Soda Shelf", [[100, 100], [250, 150]]),
            ("Aisle A - Snack Shelf", [[100, 200], [250, 250]])
        ]
        
        for name, coords in shelves_data:
            shelf = db.query(Shelf).filter(Shelf.shelf_name == name, Shelf.store_id == store.id).first()
            if not shelf:
                shelf = Shelf(
                    store_id=store.id,
                    shelf_name=name,
                    zone_coordinates=coords,
                    # legacy fields prefilled
                    name=name,
                    position_x=100.0,
                    position_y=100.0,
                    width=150.0,
                    height=50.0
                )
                db.add(shelf)
        db.commit()
        logger.info("Shelves registered.")
        logger.info("Database seeding completed successfully.")
        
    except Exception as e:
        logger.error(f"Error during database seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
