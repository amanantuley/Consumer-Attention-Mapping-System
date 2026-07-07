import logging
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, SessionLocal
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
    allow_origins=["*"], # In production, lock this down to frontend origin
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
        from app.models.postgres import Role
        
        # 1. Seed Roles if table is empty
        if db.query(Role).count() == 0:
            logger.info("Seeding Roles table (SuperAdmin, StoreManager, Analyst)...")
            db.add_all([
                Role(id="SuperAdmin", name="SuperAdmin"),
                Role(id="StoreManager", name="StoreManager"),
                Role(id="Analyst", name="Analyst")
            ])
            db.commit()
            
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

# Router Mounts
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication Legacy V1"])
app.include_router(auth.contract_router, prefix="/api/auth", tags=["Authentication Contract API"])

app.include_router(stores.router, prefix=f"{settings.API_V1_STR}/stores", tags=["Store Management Legacy V1"])
app.include_router(stores.contract_router, prefix="/api/stores", tags=["Store Management Contract API"])

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "api_version": "v1"
    }
