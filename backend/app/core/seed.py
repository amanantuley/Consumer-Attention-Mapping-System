import logging
from app.core.database import SessionLocal
from app.models.postgres import (
    Base, User, UserRole, Store, StoreZone, Shelf, 
    Product, ShelfProduct, Camera, CameraStatus, CameraType, ZoneType
)
from app.core.security import get_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cams.seed")

def seed_database():
    from app.core.database import engine
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        logger.info("Starting database seeding...")
        
        # 1. Create Default Admin if missing
        admin = db.query(User).filter(User.email == "admin@cams.com").first()
        if not admin:
            db_admin = User(
                email="admin@cams.com",
                hashed_password=get_password_hash("adminpassword"),
                full_name="System Administrator",
                role=UserRole.ADMINISTRATOR,
                is_active=True
            )
            db.add(db_admin)
            
        # 2. Create Default Store
        store = db.query(Store).filter(Store.name == "Downtown Retail #1").first()
        if not store:
            store = Store(
                name="Downtown Retail #1",
                address="456 Main St, Metropolis",
                floor_plan_url="/static/images/floor_plan_1.png"
            )
            db.add(store)
            db.commit()
            db.refresh(store)
            logger.info("Store created.")
            
        # 3. Create Store Zones
        zones = [
            ("Entrance Zone", ZoneType.ENTRANCE, {"points": [[0,0], [10,0], [10,10], [0,10]]}),
            ("Main Walkway", ZoneType.WALKWAY, {"points": [[10,0], [80,0], [80,10], [10,10]]}),
            ("Shelf Aisle A", ZoneType.SHELF_AREA, {"points": [[20,10], [40,10], [40,80], [20,80]]}),
            ("Checkout Counter", ZoneType.CHECKOUT, {"points": [[80,0], [100,0], [100,20], [80,20]]})
        ]
        
        db_zones = []
        for name, z_type, coords in zones:
            zone = db.query(StoreZone).filter(StoreZone.name == name, StoreZone.store_id == store.id).first()
            if not zone:
                zone = StoreZone(
                    store_id=store.id,
                    name=name,
                    zone_type=z_type,
                    coordinates=coords,
                    traffic_density=0.1
                )
                db.add(zone)
                db.commit()
                db.refresh(zone)
            db_zones.append(zone)
        logger.info("Store zones created.")
        
        # 4. Create Cameras
        cam1 = db.query(Camera).filter(Camera.name == "CCTV Entrance Overhead").first()
        if not cam1:
            cam1 = Camera(
                store_id=store.id,
                name="CCTV Entrance Overhead",
                rtsp_url="rtsp://192.168.1.100:8554/live",
                ip_address="192.168.1.100",
                status=CameraStatus.ONLINE,
                camera_type=CameraType.OVERHEAD
            )
            db.add(cam1)
            
        cam2 = db.query(Camera).filter(Camera.name == "CCTV Shelf Aisle A").first()
        if not cam2:
            cam2 = Camera(
                store_id=store.id,
                name="CCTV Shelf Aisle A",
                rtsp_url="rtsp://192.168.1.101:8554/live",
                ip_address="192.168.1.101",
                status=CameraStatus.ONLINE,
                camera_type=CameraType.SHELF_FACING
            )
            db.add(cam2)
        db.commit()
        db.refresh(cam2)
        logger.info("Cameras registered.")

        # 5. Create Shelves
        shelves_data = [
            ("Aisle A - Soda Shelf", db_zones[2].id, 20.0, 15.0, 1.2, 2.0, 1.5, 0.4, cam2.id),
            ("Aisle A - Snack Shelf", db_zones[2].id, 20.0, 35.0, 1.2, 2.0, 1.5, 0.4, cam2.id)
        ]
        
        db_shelves = []
        for name, z_id, px, py, pz, w, h, d, c_id in shelves_data:
            shelf = db.query(Shelf).filter(Shelf.name == name).first()
            if not shelf:
                shelf = Shelf(
                    zone_id=z_id,
                    name=name,
                    position_x=px,
                    position_y=py,
                    position_z=pz,
                    width=w,
                    height=h,
                    depth=d,
                    camera_id=c_id
                )
                db.add(shelf)
                db.commit()
                db.refresh(shelf)
            db_shelves.append(shelf)
        logger.info("Shelves registered.")

        # 6. Create Products
        products_data = [
            ("SKU-1001", "Cola Soda 350ml", "Beverages", 1.99, 0.38, {"w": 6.5, "h": 12.2, "d": 6.5}),
            ("SKU-1002", "Orange Juice 1L", "Beverages", 3.49, 1.05, {"w": 8.0, "h": 22.0, "d": 8.0}),
            ("SKU-1003", "Potato Chips Salted", "Snacks", 2.99, 0.15, {"w": 18.0, "h": 26.0, "d": 5.0}),
            ("SKU-1004", "Chocolate bar 100g", "Snacks", 1.49, 0.10, {"w": 7.0, "h": 15.0, "d": 1.0})
        ]
        
        db_products = []
        for sku, name, cat, price, wt, dims in products_data:
            prod = db.query(Product).filter(Product.sku == sku).first()
            if not prod:
                prod = Product(
                    sku=sku,
                    name=name,
                    category=cat,
                    price=price,
                    weight=wt,
                    dimensions=dims
                )
                db.add(prod)
                db.commit()
                db.refresh(prod)
            db_products.append(prod)
        logger.info("Products created.")

        # 7. Map Products to Shelves
        assignments = [
            (db_shelves[0].id, db_products[0].id, 10, 15, 3), # Soda shelf, Cola
            (db_shelves[0].id, db_products[1].id, 6, 10, 2),  # Soda shelf, Orange juice
            (db_shelves[1].id, db_products[2].id, 8, 12, 2),  # Snack shelf, Chips
            (db_shelves[1].id, db_products[3].id, 15, 20, 4)  # Snack shelf, Chocolate
        ]
        
        for s_id, p_id, stock, cap, facing in assignments:
            sp = db.query(ShelfProduct).filter(ShelfProduct.shelf_id == s_id, ShelfProduct.product_id == p_id).first()
            if not sp:
                sp = ShelfProduct(
                    shelf_id=s_id,
                    product_id=p_id,
                    stock_count=stock,
                    capacity=cap,
                    facing_count=facing
                )
                db.add(sp)
        db.commit()
        logger.info("Products assigned to shelves.")
        logger.info("Database seeding completed successfully.")
        
    except Exception as e:
        logger.error(f"Error during database seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
