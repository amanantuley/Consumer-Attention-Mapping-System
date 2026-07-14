import logging
from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, SessionLocal, redis_client
from app.models.postgres import Base, User, UserRole
from app.core.security import get_password_hash
from app.api.endpoints import auth, stores

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cams.main")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup DB Seeding
@app.on_event("startup")
def on_startup():
    logger.info("Initializing database schemas...")
    Base.metadata.create_all(bind=engine)
    
    # Seed roles and default administrator user if table is empty
    db = SessionLocal()
    try:
        from sqlalchemy import text
        from app.models.postgres import Role, Store, StoreZone, Camera
        
        # 1. Seed Roles if table is empty
        if db.query(Role).count() == 0:
            logger.info("Seeding Roles table (SuperAdmin, StoreManager, Analyst)...")
            db.add_all([
                Role(id="SuperAdmin", name="SuperAdmin"),
                Role(id="StoreManager", name="StoreManager"),
                Role(id="Analyst", name="Analyst")
            ])
            db.commit()
            
        # 2. Seed Flagship Virtual Store if empty
        flagship_store = db.query(Store).filter(Store.name == "Flagship Virtual Store").first()
        if not flagship_store:
            logger.info("Seeding Flagship Virtual Store layout, zones, and cameras...")
            flagship_store = Store(
                name="Flagship Virtual Store",
                address="Virtual Space 1, AI Grid",
                location="Simulation City",
                store_metadata={"size_sqft": 5000}
            )
            db.add(flagship_store)
            db.commit()
            db.refresh(flagship_store)
            
            # Seed 3 Zones:
            # Zone 1: Entrance/Exit Foyer
            # Zone 2: Main Product Aisle
            # Zone 3: Checkout Lanes
            zone1 = StoreZone(store_id=flagship_store.id, name="Entrance/Exit Foyer", coordinates={"x1": 0, "y1": 80, "x2": 100, "y2": 100})
            zone2 = StoreZone(store_id=flagship_store.id, name="Main Product Aisle", coordinates={"x1": 0, "y1": 20, "x2": 100, "y2": 80})
            zone3 = StoreZone(store_id=flagship_store.id, name="Checkout Lanes", coordinates={"x1": 0, "y1": 0, "x2": 100, "y2": 20})
            db.add_all([zone1, zone2, zone3])
            
            # Seed 4 Cameras:
            # Camera 1: Entrance Camera (Zone 1)
            # Camera 2: Aisle Camera 1 (Zone 2)
            # Camera 3: Aisle Camera 2 (Zone 2)
            # Camera 4: Checkout Camera (Zone 3)
            cam1 = Camera(store_id=flagship_store.id, name="Entrance Camera (Cam 1)", rtsp_url="simulation_cam1", is_active=True)
            cam2 = Camera(store_id=flagship_store.id, name="Main Product Aisle Camera (Cam 2)", rtsp_url="simulation_cam2", is_active=True)
            cam3 = Camera(store_id=flagship_store.id, name="Shelf Zoom Camera (Cam 3)", rtsp_url="simulation_cam3", is_active=True)
            cam4 = Camera(store_id=flagship_store.id, name="Checkout Lanes Camera (Cam 4)", rtsp_url="simulation_cam4", is_active=True)
            db.add_all([cam1, cam2, cam3, cam4])
            db.commit()
            logger.info("Flagship store seeding complete.")

        # 3. Create TimescaleDB hypertable if extension is available
        try:
            res = db.execute(text("SELECT * FROM pg_extension WHERE extname = 'timescaledb';")).first()
            if res:
                logger.info("TimescaleDB extension detected. Attempting to create hypertable for coordinate_logs...")
                db.execute(text("SELECT create_hypertable('coordinate_logs', 'timestamp', if_not_exists => TRUE);"))
                db.commit()
                logger.info("TimescaleDB hypertable created successfully.")
        except Exception as e:
            logger.info(f"Skipping TimescaleDB hypertable setup (normal behavior for dev/SQLite): {e}")
            
        # 4. Start background Redis stream processor
        from app.core.stream_worker import start_stream_worker_async
        start_stream_worker_async()
        logger.info("Started background stream processing worker.")

        # 5. Seed default Administrator user if empty
        admin_user = db.query(User).filter(User.email == "admin@cams.com").first()
        if not admin_user:
            logger.info("Seeding default Administrator user...")
            hashed_pwd = get_password_hash("adminpassword")
            default_admin = User(
                email="admin@cams.com",
                hashed_password=hashed_pwd,
                full_name="System Administrator",
                role_id="SuperAdmin",
                is_active=True
            )
            db.add(default_admin)
            db.commit()
            logger.info("Seeding completed successfully (Email: admin@cams.com / Pass: adminpassword)")

    except Exception as e:
        logger.error(f"Error seeding database: {e}")
    finally:
        db.close()


from app.api.endpoints import auth, stores, analytics, cameras, products
# Router Mounts
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication Legacy V1"])
app.include_router(auth.contract_router, prefix="/api/auth", tags=["Authentication Contract API"])

app.include_router(stores.router, prefix=f"{settings.API_V1_STR}/stores", tags=["Store Management Legacy V1"])
app.include_router(stores.contract_router, prefix="/api/stores", tags=["Store Management Contract API"])

app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Analytics V1"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics Contract API"])

app.include_router(cameras.router, prefix=f"{settings.API_V1_STR}/cameras", tags=["Cameras V1"])
app.include_router(cameras.router, prefix="/api/cameras", tags=["Cameras Contract API"])

app.include_router(products.router, prefix=f"{settings.API_V1_STR}/products", tags=["Products V1"])
app.include_router(products.router, prefix="/api/products", tags=["Products Contract API"])


@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "api_version": "v1"
    }

@app.websocket("/api/ws/store/{store_id}")
async def websocket_endpoint(websocket: WebSocket, store_id: str):
    await websocket.accept()
    logger.info(f"WebSocket client connected for store {store_id}")
    
    # Subscribe to Redis PubSub channel for this store
    pubsub = redis_client.pubsub()
    pubsub.subscribe(f"telemetry:store:{store_id}")
    
    import asyncio
    
    async def listen_to_redis():
        try:
            while True:
                # get_message is fast and non-blocking when using timeout
                message = pubsub.get_message(ignore_subscribe_messages=True, timeout=0.05)
                if message:
                    await websocket.send_text(message['data'])
                await asyncio.sleep(0.05)
        except Exception as e:
            logger.error(f"Error in WebSocket Redis listener: {e}")

    async def listen_to_client():
        try:
            while True:
                # Wait for disconnect or incoming message
                await websocket.receive_text()
        except WebSocketDisconnect:
            logger.info(f"WebSocket client disconnected for store {store_id}")

    try:
        await asyncio.gather(
            listen_to_redis(),
            listen_to_client(),
            return_exceptions=True
        )
    finally:
        try:
            pubsub.unsubscribe(f"telemetry:store:{store_id}")
            pubsub.close()
        except Exception:
            pass

