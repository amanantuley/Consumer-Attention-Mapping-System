import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.api import deps
from app.models.postgres import Base, User, UserRole
from app.core.security import get_password_hash

# In-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

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
def client():
    # Seed roles and a test user
    db = TestingSessionLocal()
    from app.models.postgres import Role
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
    
    manager = User(
        email="test_manager@cams.com",
        hashed_password=hashed_pwd,
        full_name="Test Manager",
        role_id="StoreManager",
        is_active=True
    )
    db.add(manager)
    db.commit()
    db.close()
    
    with TestClient(app) as c:
        yield c
        
    # Cleanup
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

def test_read_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_login(client):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "test_analyst@cams.com", "password": "testpassword"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "retail_analyst"

def test_invalid_login(client):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "test_analyst@cams.com", "password": "wrongpassword"}
    )
    assert response.status_code == 400

def test_cameras_endpoints(client):
    # Get auth token
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "test_manager@cams.com", "password": "testpassword"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. List cameras (should seed default cameras since db is empty)
    res = client.get("/api/cameras/", headers=headers)
    assert res.status_code == 200
    data = res.json()
    # If a store exists, it seeds default cameras. Since in testing db there are no stores, it returns empty
    assert isinstance(data, list)

    # 2. Add camera (should fail because store does not exist)
    res = client.post(
        "/api/cameras/",
        json={"store_id": "non-existent-uuid", "name": "Test Cam", "rtsp_url": "0"},
        headers=headers
    )
    assert res.status_code == 404

def test_products_endpoints(client):
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "test_analyst@cams.com", "password": "testpassword"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. List products (should seed default products)
    res = client.get("/api/products/", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    assert data[0]["name"] == "Coca-Cola 500ml"

    # 2. Add product
    res = client.post(
        "/api/products/",
        json={"name": "Pepsi 500ml", "sku": "PEPSI-500", "category": "Beverages", "price": 1.79, "stock": 40},
        headers=headers
      )
    assert res.status_code == 200
    p_data = res.json()
    assert p_data["sku"] == "PEPSI-500"

    # 3. Add product with existing SKU (should fail)
    res = client.post(
        "/api/products/",
        json={"name": "Pepsi 500ml", "sku": "PEPSI-500", "category": "Beverages", "price": 1.79},
        headers=headers
    )
    assert res.status_code == 400



