from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy.orm import selectinload
from ..models.user import User
from ..schemas.user import UserCreate, UserUpdate
from ..core.security import get_password_hash, verify_password

class UserService:
    @staticmethod
    def get_user(db: Session, user_id: int) -> Optional[User]:
        return db.query(User).options(selectinload(User.role)).filter(User.id == user_id).first()

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).options(selectinload(User.role)).filter(User.email == email).first()
    
    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        return db.query(User).options(selectinload(User.role)).filter(User.username == username).first()

    @staticmethod
    def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        return db.query(User).options(selectinload(User.role)).offset(skip).limit(limit).all()

    @staticmethod
    def create_user(db: Session, user: UserCreate) -> User:
        hashed_password = get_password_hash(user.password)
        db_user = User(
            username=user.username,
            email=user.email,
            hashed_password=hashed_password,
            full_name=user.full_name,
            role_id=user.role_id
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db.query(User).options(selectinload(User.role)).filter(User.id == db_user.id).first()

    @staticmethod
    def update_user(db: Session, user_id: int, user_update: UserUpdate) -> Optional[User]:
        db_user = UserService.get_user(db, user_id)
        if not db_user:
            return None
        update_data = user_update.model_dump(exclude_unset=True)
        if "password" in update_data:
            update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
        for key, value in update_data.items():
            setattr(db_user, key, value)
        db.commit()
        db.refresh(db_user)
        return db.query(User).options(selectinload(User.role)).filter(User.id == db_user.id).first()
    
    @staticmethod
    def delete_user(db: Session, user_id: int) -> bool:
        db_user = UserService.get_user(db, user_id)
        if not db_user:
            return False
        db.delete(db_user)
        db.commit()
        return True

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        user = UserService.get_user_by_email(db, email)
        if not user:
            user = UserService.get_user_by_username(db, email)  # Allow login via username or email
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user
