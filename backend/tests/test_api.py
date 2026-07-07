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

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[deps.get_db] = override_get_db

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


