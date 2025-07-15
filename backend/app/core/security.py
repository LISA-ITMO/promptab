"""
Security module for working with JWT and passwords
"""

from datetime import datetime, timedelta
from typing import Any, Optional, Union
from jose import jwt, JWTError
from passlib.context import CryptContext
from loguru import logger

from app.core.config import settings
from app.core.exceptions import AuthenticationError

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None,
    additional_claims: Optional[dict] = None,
) -> str:
    """
    Create JWT access token
    
    Args:
        subject: User identifier (usually user_id)
        expires_delta: Token lifetime
        additional_claims: Additional data for the token
    
    Returns:
        JWT token
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "iat": datetime.utcnow(),
        "type": "access",
    }
    
    if additional_claims:
        to_encode.update(additional_claims)
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def create_refresh_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create JWT refresh token
    
    Args:
        subject: User identifier
        expires_delta: Token lifetime
    
    Returns:
        JWT refresh token
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
        )
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "iat": datetime.utcnow(),
        "type": "refresh",
    }
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def decode_token(token: str) -> dict:
    """
    Decode JWT token
    
    Args:
        token: JWT token
    
    Returns:
        Token payload
    
    Raises:
        AuthenticationError: If the token is invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationError("Token has expired")
    except JWTError as e:
        logger.error(f"JWT decode error: {str(e)}")
        raise AuthenticationError("Could not validate token")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password
    
    Args:
        plain_password: Plain password
        hashed_password: Hashed password
    
    Returns:
        True if the password is correct
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash password
    
    Args:
        password: Plain password
    
    Returns:
        Hashed password
    """
    return pwd_context.hash(password)


def generate_reset_password_token(email: str) -> str:
    """
    Generate token for password reset
    
    Args:
        email: User email
    
    Returns:
        JWT token for password reset
    """
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode = {
        "exp": expire,
        "sub": email,
        "type": "reset_password",
    }
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def verify_reset_password_token(token: str) -> Optional[str]:
    """
    Verify token for password reset
    
    Args:
        token: JWT token
    
    Returns:
        User email or None
    """
    try:
        payload = decode_token(token)
        if payload.get("type") != "reset_password":
            return None
        return payload.get("sub")
    except AuthenticationError:
        return None

