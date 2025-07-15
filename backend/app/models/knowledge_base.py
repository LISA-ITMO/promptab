"""
Knowledge base model for RAG
"""

from datetime import datetime
from sqlalchemy import Column, DateTime, String, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
import uuid

from app.core.database import Base
from app.core.config import settings


class KnowledgeBase(Base):
    """Model for storing prompts in knowledge base and their vector representations"""
    
    __tablename__ = "knowledge_base"
    __table_args__ = {"schema": "promptab"}
    __allow_unmapped__ = True
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(100), nullable=True, index=True)
    
    # Vector representation for semantic search
    embedding = Column(Vector(settings.VECTOR_DIMENSION))
    
    # Metadata (source, tags, rating, etc.)
    meta_data = Column(JSON, default={})
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __repr__(self) -> str:
        return f"<KnowledgeBase(id={self.id}, title={self.title}, category={self.category})>"
