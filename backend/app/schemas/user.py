"""
Schemas for working with users
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from uuid import UUID


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    is_active: bool = True
    is_verified: bool = False
    is_superuser: bool = False


class UserCreate(UserBase):
    """Schema for creating user"""
    password: str = Field(..., min_length=8, max_length=100)


class UserUpdate(BaseModel):
    """Schema for updating user"""
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=100)
    password: Optional[str] = Field(None, min_length=8, max_length=100)
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None


class UserInDBBase(UserBase):
    """Base user schema in DB"""
    id: UUID
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class User(UserInDBBase):
    """User schema for API responses"""
    pass


class UserInDB(UserInDBBase):
    """User schema in DB with hashed password"""
    hashed_password: str


class UserStats(BaseModel):
    """User statistics"""
    total_prompts: int = 0
    total_templates: int = 0
    total_variables: int = 0
    total_optimizations: int = 0
    last_activity: Optional[datetime] = None

