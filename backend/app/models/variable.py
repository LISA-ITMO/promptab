"""
Models for working with variables
"""

from datetime import datetime
from typing import TYPE_CHECKING, List
from sqlalchemy import (
    Column, DateTime, ForeignKey, String, Text, Integer, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class VariableCategory(Base):
    """Model for variable categories"""
    
    __tablename__ = "variable_categories"
    __table_args__ = (
        UniqueConstraint("user_id", "name", name="unique_user_category_name"),
        {"schema": "promptab"}
    )
    __allow_unmapped__ = True
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("promptab.users.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String(7), default="#3B82F6")  # HEX color for UI
    icon = Column(String(50), nullable=True)  # Icon name for UI
    
    # Usage counter
    usage_count = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user: "User" = relationship("User", back_populates="variable_categories")
    variables: List["Variable"] = relationship("Variable", back_populates="category", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<VariableCategory(id={self.id}, name={self.name}, user_id={self.user_id})>"


class Variable(Base):
    """Model for variables"""
    
    __tablename__ = "variables"
    __table_args__ = (
        UniqueConstraint("user_id", "name", name="unique_user_variable_name"),
        {"schema": "promptab"}
    )
    __allow_unmapped__ = True
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("promptab.users.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("promptab.variable_categories.id", ondelete="SET NULL"), nullable=True)
    
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    default_value = Column(Text, nullable=True)
    
    # Usage examples
    examples = Column(Text, nullable=True)
    
    # Usage counter
    usage_count = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user: "User" = relationship("User", back_populates="variables")
    category: "VariableCategory" = relationship("VariableCategory", back_populates="variables")
    
    def __repr__(self) -> str:
        return f"<Variable(id={self.id}, name={self.name}, user_id={self.user_id})>"
