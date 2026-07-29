from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import Optional
from .role import Role


class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str
    role_id: int


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    role_id: Optional[int] = None


class User(UserBase):
    id: int
    is_active: bool
    role_id: int
    role: Optional[Role] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str
    user: User


class TokenData(BaseModel):
    email: Optional[str] = None

