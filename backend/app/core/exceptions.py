"""
Custom exceptions for PrompTab
"""

from typing import Any, Dict, Optional


class PrompTabException(Exception):
    """Base exception for PrompTab"""
    
    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: str,
        headers: Optional[Dict[str, Any]] = None,
    ):
        self.status_code = status_code
        self.detail = detail
        self.error_code = error_code
        self.headers = headers
        super().__init__(detail)


class AuthenticationError(PrompTabException):
    """Authentication error"""
    
    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(
            status_code=401,
            detail=detail,
            error_code="AUTHENTICATION_ERROR",
            headers={"WWW-Authenticate": "Bearer"},
        )


class AuthorizationError(PrompTabException):
    """Authorization error"""
    
    def __init__(self, detail: str = "Not enough permissions"):
        super().__init__(
            status_code=403,
            detail=detail,
            error_code="AUTHORIZATION_ERROR",
        )


class NotFoundError(PrompTabException):
    """Resource not found"""
    
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(
            status_code=404,
            detail=detail,
            error_code="NOT_FOUND",
        )


class ValidationError(PrompTabException):
    """Validation error"""
    
    def __init__(self, detail: str = "Validation error"):
        super().__init__(
            status_code=422,
            detail=detail,
            error_code="VALIDATION_ERROR",
        )


class RateLimitError(PrompTabException):
    """Rate limit exceeded"""
    
    def __init__(self, detail: str = "Too many requests"):
        super().__init__(
            status_code=429,
            detail=detail,
            error_code="RATE_LIMIT_EXCEEDED",
        )


class LLMError(PrompTabException):
    """LLM service error"""
    
    def __init__(self, detail: str = "LLM service error"):
        super().__init__(
            status_code=502,
            detail=detail,
            error_code="LLM_ERROR",
        )


class VectorStoreError(PrompTabException):
    """Vector store error"""
    
    def __init__(self, detail: str = "Vector store error"):
        super().__init__(
            status_code=500,
            detail=detail,
            error_code="VECTOR_STORE_ERROR",
        )


class PromptOptimizationError(PrompTabException):
    """Prompt optimization error"""
    
    def __init__(self, detail: str = "Failed to optimize prompt"):
        super().__init__(
            status_code=500,
            detail=detail,
            error_code="PROMPT_OPTIMIZATION_ERROR",
        )


class TemplateError(PrompTabException):
    """Template error"""
    
    def __init__(self, detail: str = "Template error"):
        super().__init__(
            status_code=400,
            detail=detail,
            error_code="TEMPLATE_ERROR",
        )


class VariableError(PrompTabException):
    """Variable error"""
    
    def __init__(self, detail: str = "Variable error"):
        super().__init__(
            status_code=400,
            detail=detail,
            error_code="VARIABLE_ERROR",
        )

