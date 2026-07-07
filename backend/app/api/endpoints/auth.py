from datetime import timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api import deps
from app.core import security
from app.core.config import settings
from app.models.postgres import User, Role
from app.schemas.user import UserCreate, UserResponse, UserUpdate, Token, UserLoginRequest

# Legacy Router for /api/v1/auth (Form Login, Legacy Role names)
router = APIRouter()

# API Contract Router for /api/auth (JSON Login, API Contract Role names)
contract_router = APIRouter()

# Role mapping helpers
def map_role_to_legacy(role_id: str) -> str:
    mapping = {
        "SuperAdmin": "administrator",
        "StoreManager": "store_manager",
        "Analyst": "retail_analyst",
        "administrator": "administrator",
        "store_manager": "store_manager",
        "retail_analyst": "retail_analyst",
        "marketing_manager": "retail_analyst"
    }
    return mapping.get(role_id, "retail_analyst")

def map_role_to_contract(role_id: str) -> str:
    mapping = {
        "SuperAdmin": "admin",
        "administrator": "admin",
        "admin": "admin",
        "StoreManager": "store_manager",
        "store_manager": "store_manager",
        "Analyst": "analyst",
        "retail_analyst": "analyst",
        "marketing_manager": "analyst"
    }
    return mapping.get(role_id, "analyst")

def map_role_from_input(input_role: str) -> str:
    r = input_role.strip().lower()
    if r in ["superadmin", "administrator", "admin"]:
        return "SuperAdmin"
    elif r in ["storemanager", "store_manager"]:
        return "StoreManager"
    else:
        return "Analyst"

# ----------------- Legacy Router (/api/v1/auth) -----------------

@router.post("/register", response_model=UserResponse)
def register_user(
    user_in: UserCreate,
    db: Session = Depends(deps.get_db)
):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system."
        )
    
    first_user = db.query(User).first() is None
    role_id = "SuperAdmin" if first_user else map_role_from_input(user_in.role)
    
    hashed_password = security.get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        role_id=role_id,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Return with legacy mapped role
    response_user = UserResponse(
        id=db_user.id,
        email=db_user.email,
        full_name=db_user.full_name,
        role=map_role_to_legacy(db_user.role_id),
        is_active=db_user.is_active,
        created_at=db_user.created_at
    )
    return response_user

@router.post("/login", response_model=Token)
def login(
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    access_token = security.create_access_token(subject=user.id)
    refresh_token = security.create_refresh_token(subject=user.id)
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        role=map_role_to_legacy(user.role_id),
        full_name=user.full_name
    )

@router.post("/refresh", response_model=Token)
def refresh_token(
    refresh_token_str: str,
    db: Session = Depends(deps.get_db)
):
    payload = security.decode_token(refresh_token_str)
    sub = payload.get("sub")
    token_type = payload.get("type")
    
    if not sub or token_type != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
        
    user = db.query(User).filter(User.id == str(sub)).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
        
    access_token = security.create_access_token(subject=user.id)
    new_refresh_token = security.create_refresh_token(subject=user.id)
    return Token(
        access_token=access_token,
        refresh_token=new_refresh_token,
        role=map_role_to_legacy(user.role_id),
        full_name=user.full_name
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(deps.get_current_active_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=map_role_to_legacy(current_user.role_id),
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )

@router.get("/users", response_model=List[UserResponse])
def get_users(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker(["SuperAdmin", "administrator"]))
):
    users = db.query(User).all()
    return [
        UserResponse(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=map_role_to_legacy(u.role_id),
            is_active=u.is_active,
            created_at=u.created_at
        ) for u in users
    ]

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    user_in: UserUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    if current_user.role_id != "SuperAdmin" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this profile"
        )
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_in.email is not None:
        user.email = user_in.email
    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.password is not None:
        user.hashed_password = security.get_password_hash(user_in.password)
    if user_in.role is not None and current_user.role_id == "SuperAdmin":
        user.role_id = map_role_from_input(user_in.role)
    if user_in.is_active is not None and current_user.role_id == "SuperAdmin":
        user.is_active = user_in.is_active
        
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=map_role_to_legacy(user.role_id),
        is_active=user.is_active,
        created_at=user.created_at
    )


# ----------------- API Contract Router (/api/auth) -----------------

@contract_router.post("/register")
def register_contract(
    user_in: UserCreate,
    db: Session = Depends(deps.get_db)
):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system."
        )
    
    first_user = db.query(User).first() is None
    role_id = "SuperAdmin" if first_user else map_role_from_input(user_in.role)
    
    hashed_password = security.get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        role_id=role_id,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return {
        "id": db_user.id,
        "email": db_user.email,
        "role": map_role_to_contract(db_user.role_id),
        "is_active": db_user.is_active
    }

@contract_router.post("/login")
def login_contract(
    login_in: UserLoginRequest,
    db: Session = Depends(deps.get_db)
):
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not security.verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    access_token = security.create_access_token(subject=user.id)
    refresh_token = security.create_refresh_token(subject=user.id)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": map_role_to_contract(user.role_id),
        "email": user.email,
        "id": user.id,
        "full_name": user.full_name
    }

