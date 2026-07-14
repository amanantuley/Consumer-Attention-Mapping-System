import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.api import deps
from app.models.postgres import Base, User, Store, Shelf, ShopperSession, Product, ProductInteraction, Role
from app.core.security import get_password_hash
from app.ai.feature_extractor import SessionFeatureExtractor

# File-based SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_features.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Drop and recreate all tables to ensure latest columns are present
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

@pytest.fixture(scope="module", autouse=True)
def override_db():
    app.dependency_overrides[deps.get_db] = override_get_db
    yield
    if deps.get_db in app.dependency_overrides:
        del app.dependency_overrides[deps.get_db]

@pytest.fixture(scope="module")
def db_session():
    db = TestingSessionLocal()
    # Seed roles
    db.add_all([
        Role(id="SuperAdmin", name="SuperAdmin"),
        Role(id="StoreManager", name="StoreManager"),
        Role(id="Analyst", name="Analyst")
    ])
    db.commit()
    
    hashed_pwd = get_password_hash("testpassword")
    user = User(
        email="test_analyst@cams.com",
        hashed_password=hashed_pwd,
        full_name="Test Analyst",
        role_id="Analyst",
        is_active=True
    )
    db.add(user)
    
    # Create store, shelf, and product
    store = Store(name="Test Feature Store", address="123 Test St")
    db.add(store)
    db.commit()
    db.refresh(store)
    
    shelf = Shelf(store_id=store.id, shelf_name="Shelf 1", zone_coordinates=[[0.0, 0.0], [0.5, 0.5]])
    db.add(shelf)
    
    product = Product(name="Test Soda", sku="TEST-SODA", category="Beverages", price=1.5, stock=100)
    db.add(product)
    db.commit()
    db.refresh(product)
    
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

@pytest.fixture(scope="module")
def client(db_session):
    with TestClient(app) as c:
        yield c

def test_feature_extraction_and_classification(db_session, client):
    # Get auth token
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "test_analyst@cams.com", "password": "testpassword"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a shopper session
    store = db_session.query(Store).first()
    session_uuid = "test_uuid_12345"
    start_time = datetime.utcnow() - timedelta(minutes=10)
    end_time = datetime.utcnow()
    
    session = ShopperSession(
        tracking_uuid=session_uuid,
        store_id=store.id,
        start_time=start_time,
        end_time=end_time,
        segment="Regular"
    )
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)
    
    # 2. Add product interactions in PostgreSQL
    product = db_session.query(Product).first()
    shelf = db_session.query(Shelf).first()
    
    pickup_interaction = ProductInteraction(
        session_id=session.id,
        product_id=product.id,
        shelf_id=shelf.id,
        interaction_type="pickup",
        timestamp=start_time + timedelta(minutes=2)
    )
    purchase_interaction = ProductInteraction(
        session_id=session.id,
        product_id=product.id,
        shelf_id=shelf.id,
        interaction_type="purchase",
        timestamp=start_time + timedelta(minutes=8)
    )
    db_session.add_all([pickup_interaction, purchase_interaction])
    db_session.commit()

    # 3. Add coordinate logs in SQL DB and Mock MongoDB gaze telemetry
    from app.models.postgres import CoordinateLog
    log1 = CoordinateLog(
        session_uuid=session_uuid,
        store_id=store.id,
        timestamp=start_time,
        x=0.1,
        y=0.1,
        velocity=1.0
    )
    log2 = CoordinateLog(
        session_uuid=session_uuid,
        store_id=store.id,
        timestamp=start_time + timedelta(minutes=5),
        x=0.2,
        y=0.2,
        velocity=1.0
    )
    db_session.add_all([log1, log2])
    db_session.commit()

    mock_gaze = [
        {"session_uuid": session_uuid, "timestamp": start_time + timedelta(minutes=1), "focus_duration": 15.5, "target_id": product.id},
        {"session_uuid": session_uuid, "timestamp": start_time + timedelta(minutes=6), "focus_duration": 10.0, "target_id": product.id}
    ]
    
    with patch("app.ai.feature_extractor.mongo_db") as mock_db:
        # Configure mocks to return lists when find is called
        mock_db.gaze_telemetry.find = MagicMock(return_value=mock_gaze)
        
        # Test feature extraction directly
        extracted = SessionFeatureExtractor.extract_features(db_session, session_uuid)
        
        assert extracted["session_uuid"] == session_uuid
        assert extracted["metrics"]["products_picked"] == 1
        assert extracted["metrics"]["products_returned"] == 0
        assert extracted["metrics"]["products_purchased"] == 1
        assert extracted["metrics"]["gaze_focus_duration"] == 25.5
        # Dwell time should span from start_time to start_time + 6 minutes (360 seconds) in MongoDB telemetry
        assert extracted["metrics"]["dwell_time"] == 360.0
        # Coords overlap with the shelf [0.0, 0.0] -> [0.5, 0.5], so zones visited should be 1
        assert extracted["metrics"]["zones_visited"] == 1

        # Test classification and database update
        result = SessionFeatureExtractor.classify_and_update_session(db_session, session_uuid)
        assert "classification" in result
        assert result["classification"]["class"] in ["Explorer", "Quick Buyer", "Impulse Buyer", "Comparison Shopper", "Brand Loyal"]
        
        # Verify SQL DB is updated
        db_session.refresh(session)
        assert session.segment == result["classification"]["class"]

        # Test API Endpoint using test client
        res = client.post(f"/api/analytics/sessions/{session_uuid}/classify", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["session_uuid"] == session_uuid
        assert "classification" in data
        assert "metrics" in data
