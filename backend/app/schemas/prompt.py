"""
Schemas for working with prompts
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from enum import Enum


class OptimizationTechnique(str, Enum):
    """Available optimization techniques"""
    CHAIN_OF_THOUGHT = "chain_of_thought"
    ROLE_PLAYING = "role_playing"
    FEW_SHOT = "few_shot"
    PROMPT_CHAINING = "prompt_chaining"
    STRUCTURED_OUTPUT = "structured_output"


class PromptOptimizeRequest(BaseModel):
    """Prompt optimization request"""
    prompt: str = Field(..., min_length=1, max_length=10000)
    techniques: Optional[List[OptimizationTechnique]] = None
    use_rag: bool = True
    llm_provider: Optional[str] = None
    language: str = Field("auto", pattern="^(auto|ru|en)$")


class PromptVariable(BaseModel):
    """Variable in prompt"""
    text: str
    suggested_name: str
    type: str  # "quoted", "entity", "number"


class PromptStructure(BaseModel):
    """Prompt structure"""
    role: str = ""
    task: str = ""
    context: str = ""
    instructions: str = ""
    constraints: str = ""
    tone: str = ""
    full_prompt: str


class RAGSource(BaseModel):
    """RAG source"""
    id: str
    title: str
    content: str
    category: Optional[str] = None
    similarity: float


class PromptOptimizeResponse(BaseModel):
    """Prompt optimization response"""
    original: str
    optimized: str
    techniques_used: List[str]
    rag_sources: List[RAGSource]
    structure: PromptStructure
    variables: List[PromptVariable]
    metadata: Dict[str, Any]


class UserPromptBase(BaseModel):
    """Base schema for user prompt"""
    title: str = Field(..., min_length=1, max_length=255)
    original_prompt: str
    optimized_prompt: str
    variables: List[Dict[str, Any]] = []
    category: Optional[str] = None
    tags: List[str] = []
    is_template: bool = False
    is_public: bool = False


class UserPromptCreate(UserPromptBase):
    """Schema for creating prompt"""
    pass


class UserPromptUpdate(BaseModel):
    """Schema for updating prompt"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    optimized_prompt: Optional[str] = None
    variables: Optional[List[Dict[str, Any]]] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    is_template: Optional[bool] = None
    is_public: Optional[bool] = None


class UserPrompt(UserPromptBase):
    """Prompt schema for API responses"""
    id: UUID
    user_id: UUID
    usage_count: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class PromptHistoryBase(BaseModel):
    """Base schema for prompt history"""
    session_id: UUID
    original_prompt: str
    optimized_prompt: str
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None
    optimization_techniques: List[str] = []
    response_time_ms: Optional[int] = None
    user_rating: Optional[int] = Field(None, ge=1, le=5)


class PromptHistory(PromptHistoryBase):
    """Schema for API responses"""
    id: UUID
    user_id: UUID
    rag_sources: List[UUID] = []
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class FeedbackCreate(BaseModel):
    """Create feedback"""
    prompt_history_id: UUID
    rating: str = Field(..., pattern="^(like|dislike)$")
    comment: Optional[str] = None


class PromptExportRequest(BaseModel):
    """Prompt export request"""
    format: str = Field("json", pattern="^(json|csv|txt)$")
    include_history: bool = False
    include_templates: bool = True

