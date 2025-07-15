"""
User model
"""

from datetime import datetime
from typing import List, TYPE_CHECKING
from sqlalchemy import Boolean, Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped
import uuid

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.prompt import UserPrompt, PromptHistory, Feedback
    from app.models.variable import Variable, VariableCategory


class User(Base):
    """User model"""
    
    __tablename__ = "users"
    __table_args__ = {"schema": "promptab"}
    __allow_unmapped__ = True
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    
    # Statuses
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    prompts: List["UserPrompt"] = relationship("UserPrompt", back_populates="user", cascade="all, delete-orphan")
    prompt_history: List["PromptHistory"] = relationship("PromptHistory", back_populates="user", cascade="all, delete-orphan")
    feedback: List["Feedback"] = relationship("Feedback", back_populates="user", cascade="all, delete-orphan")
    variables: List["Variable"] = relationship("Variable", back_populates="user", cascade="all, delete-orphan")
    variable_categories: List["VariableCategory"] = relationship("VariableCategory", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, username={self.username})>"
