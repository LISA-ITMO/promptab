"""
Models for working with prompts
"""

from datetime import datetime
from typing import TYPE_CHECKING, List
from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey, Integer, 
    String, Text, JSON, ARRAY, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class UserPrompt(Base):
    """Model for storing user prompts"""
    
    __tablename__ = "user_prompts"
    __table_args__ = {"schema": "promptab"}
    __allow_unmapped__ = True
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("promptab.users.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String(255), nullable=False)
    original_prompt = Column(Text, nullable=False)
    optimized_prompt = Column(Text, nullable=False)
    
    # Variables in format [{"name": "var1", "description": "...", "default_value": "..."}]
    variables = Column(JSON, default=[])
    
    category = Column(String(100), nullable=True, index=True)
    tags = Column(ARRAY(String), default=[])
    
    is_template = Column(Boolean, default=False, nullable=False)
    is_public = Column(Boolean, default=False, nullable=False)
    usage_count = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user: "User" = relationship("User", back_populates="prompts")
    
    def __repr__(self) -> str:
        return f"<UserPrompt(id={self.id}, title={self.title}, user_id={self.user_id})>"


class PromptHistory(Base):
    """Model for storing prompt history"""
    
    __tablename__ = "prompt_history"
    __table_args__ = (
        CheckConstraint("user_rating >= 1 AND user_rating <= 5", name="check_user_rating"),
        {"schema": "promptab"}
    )
    __allow_unmapped__ = True
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("promptab.users.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    original_prompt = Column(Text, nullable=False)
    optimized_prompt = Column(Text, nullable=False)
    
    # Optimization information
    llm_provider = Column(String(50), nullable=True)
    llm_model = Column(String(100), nullable=True)
    optimization_techniques = Column(ARRAY(String), default=[])
    rag_sources = Column(ARRAY(UUID(as_uuid=True)), default=[])  # IDs from knowledge_base
    
    # Metrics
    response_time_ms = Column(Integer, nullable=True)
    user_rating = Column(Integer, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Relationships
    user: "User" = relationship("User", back_populates="prompt_history")
    feedback: List["Feedback"] = relationship("Feedback", back_populates="prompt_history", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<PromptHistory(id={self.id}, user_id={self.user_id}, session_id={self.session_id})>"


class Feedback(Base):
    """Model for feedback"""
    
    __tablename__ = "feedback"
    __table_args__ = (
        CheckConstraint("rating IN ('like', 'dislike')", name="check_feedback_rating"),
        {"schema": "promptab"}
    )
    __allow_unmapped__ = True
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("promptab.users.id", ondelete="CASCADE"), nullable=False)
    prompt_history_id = Column(UUID(as_uuid=True), ForeignKey("promptab.prompt_history.id", ondelete="CASCADE"), nullable=False)
    
    rating = Column(String(20), nullable=False)  # 'like' or 'dislike'
    comment = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Relationships
    user: "User" = relationship("User", back_populates="feedback")
    prompt_history: "PromptHistory" = relationship("PromptHistory", back_populates="feedback")
    
    def __repr__(self) -> str:
        return f"<Feedback(id={self.id}, rating={self.rating}, user_id={self.user_id})>"
