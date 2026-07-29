from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...schemas.user import User, UserCreate, UserUpdate
from ...services.user_service import UserService
from ..deps import get_current_user
from ...models.user import User as UserModel

router = APIRouter(prefix="/users", tags=["users"])


def is_admin(current_user: UserModel = Depends(get_current_user)):
    if current_user.role.name != "Administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource"
        )
    return current_user


@router.get("", response_model=List[User], dependencies=[Depends(is_admin)])
def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return UserService.get_users(db, skip=skip, limit=limit)


@router.post("", response_model=User, status_code=status.HTTP_201_CREATED, dependencies=[Depends(is_admin)])
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = UserService.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    db_user = UserService.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    return UserService.create_user(db=db, user=user)


@router.get("/{user_id}", response_model=User, dependencies=[Depends(is_admin)])
def get_user(user_id: int, db: Session = Depends(get_db)):
    db_user = UserService.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return db_user


@router.put("/{user_id}", response_model=User, dependencies=[Depends(is_admin)])
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    db_user = UserService.update_user(db, user_id=user_id, user_update=user_update)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return db_user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(is_admin)])
def delete_user(user_id: int, db: Session = Depends(get_db)):
    success = UserService.delete_user(db, user_id=user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
