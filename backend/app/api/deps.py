"""
API Dependencies
"""

from typing import Optional, Generator
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError
from loguru import logger

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_token
from app.core.exceptions import AuthenticationError, AuthorizationError
from app.models.user import User
from app.services.llm_service import LLMService
from app.services.vector_store import VectorStore
from app.services.prompt_optimizer import PromptOptimizer


# Security scheme for JWT
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Get current user from JWT token
    
    Args:
        credentials: JWT token from Authorization header
        db: Database session
        
    Returns:
        Current user
        
    Raises:
        AuthenticationError: If token is invalid or user not found
    """
    token = credentials.credentials
    
    try:
        # Decode token
        payload = decode_token(token)
        user_id = payload.get("sub")
        
        if not user_id:
            raise AuthenticationError("Invalid token payload")
        
        # Get user from database
        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            raise AuthenticationError("User not found")
        
        if not user.is_active:
            raise AuthenticationError("Inactive user")
        
        return user
        
    except JWTError as e:
        logger.error(f"JWT error: {str(e)}")
        raise AuthenticationError("Could not validate credentials")
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise AuthenticationError("Authentication failed")


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get active user
    
    Args:
        current_user: Current user
        
    Returns:
        Active user
        
    Raises:
        AuthorizationError: If user is not active
    """
    if not current_user.is_active:
        raise AuthorizationError("Inactive user")
    return current_user


async def get_current_verified_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Get verified user
    
    Args:
        current_user: Current active user
        
    Returns:
        Verified user
        
    Raises:
        AuthorizationError: If user is not verified
    """
    if not current_user.is_verified:
        raise AuthorizationError("Unverified user")
    return current_user


async def get_current_superuser(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Get superuser
    
    Args:
        current_user: Current active user
        
    Returns:
        Superuser
        
    Raises:
        AuthorizationError: If user is not a superuser
    """
    if not current_user.is_superuser:
        raise AuthorizationError("Not enough permissions")
    return current_user


def get_llm_service() -> LLMService:
    """
    Get LLM service
    
    Returns:
        LLMService instance
    """
    return LLMService()


def get_vector_store(request: Request) -> VectorStore:
    """
    Get vector store from application state
    
    Args:
        request: FastAPI Request object
        
    Returns:
        VectorStore instance
    """
    return request.app.state.vector_store


def get_prompt_optimizer(
    llm_service: LLMService = Depends(get_llm_service),
    vector_store: VectorStore = Depends(get_vector_store)
) -> PromptOptimizer:
    """
    Get prompt optimization service
    
    Args:
        llm_service: LLM service
        vector_store: Vector store
        
    Returns:
        PromptOptimizer instance
    """
    return PromptOptimizer(llm_service, vector_store)


# Optional user dependency for public endpoints
async def get_optional_current_user(
    authorization: Optional[str] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """
    Get current user if token is provided
    
    Args:
        authorization: JWT token (optional)
        db: Database session
        
    Returns:
        User or None
    """
    if not authorization:
        return None
    
    try:
        return await get_current_user(authorization, db)
    except AuthenticationError:
        return None
