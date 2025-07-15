"""
Import all models for Alembic
"""

from app.core.database import Base

# Import all models for automatic table creation
from app.models.user import User
from app.models.prompt import UserPrompt, PromptHistory, Feedback
from app.models.knowledge_base import KnowledgeBase
from app.models.variable import Variable, VariableCategory

