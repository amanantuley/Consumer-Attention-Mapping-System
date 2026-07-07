from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "Analyst"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    full_name: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
    type: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str
