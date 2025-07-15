"""
Application configuration
"""

import os
from typing import List, Optional, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, validator
import json


class Settings(BaseSettings):
    """Application settings"""
    
    # Basic settings
    PROJECT_NAME: str = "PrompTab"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Backend settings
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    BACKEND_RELOAD: bool = True
    LOG_LEVEL: str = "INFO"
    
    # Database
    POSTGRES_HOST: str
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    
    @property
    def DATABASE_URL(self) -> str:
        """Database connection string"""
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    # Redis
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    
    @property
    def REDIS_URL(self) -> str:
        """Redis connection string"""
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
    
    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # LLM API keys
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    DEEPSEEK_API_KEY: Optional[str] = None
    PERPLEXITY_API_KEY: Optional[str] = None
    
    # Ollama
    OLLAMA_BASE_URL: str = "http://ollama:11434"
    OLLAMA_MODEL: str = "llama3.1"
    
    # Vector database
    VECTOR_EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    VECTOR_DIMENSION: int = 384
    SIMILARITY_THRESHOLD: float = 0.75
    MAX_SEARCH_RESULTS: int = 5
    
    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"
    CHROME_EXTENSION_ID: Optional[str] = None
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "chrome-extension://*"]
    
    @validator("CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        """Parse CORS origins"""
        if isinstance(v, str) and v.startswith("["):
            return json.loads(v)
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # Sentry
    SENTRY_DSN: Optional[str] = None
    
    # Feature flags
    ENABLE_RAG: bool = True
    ENABLE_PROMPT_OPTIMIZATION: bool = True
    ENABLE_USER_FEEDBACK: bool = True
    
    # Limits
    MAX_PROMPT_LENGTH: int = 10000
    MAX_VARIABLES_PER_TEMPLATE: int = 20
    MAX_TEMPLATES_PER_USER: int = 100
    MAX_HISTORY_ITEMS: int = 1000
    
    # Rate limiting
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 60
    RATE_LIMIT_BURST: int = 10
    
    # Prompt optimization
    OPTIMIZATION_TECHNIQUES: List[str] = [
        "chain_of_thought",
        "role_playing",
        "few_shot",
        "prompt_chaining",
        "structured_output"
    ]
    
    # System prompts
    SYSTEM_PROMPT_OPTIMIZER: str = """You are an expert prompt engineer specializing in optimizing prompts for large language models. 
    Your task is to analyze and improve user prompts using advanced techniques like Chain-of-Thought, Role-playing, and Few-shot learning.
    Always structure the output clearly and make the prompt more effective."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


# Create settings instance
settings = Settings()

