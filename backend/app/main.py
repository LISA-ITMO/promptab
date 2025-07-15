"""
PrompTab Backend API
Intelligent browser extension for prompt optimization
"""

from contextlib import asynccontextmanager
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
import sentry_sdk
from sentry_sdk.integrations.asgi import SentryAsgiMiddleware

from app.core.config import settings
from app.core.database import engine
from app.db.base import Base
from app.api.v1.api import api_router
from app.core.exceptions import PrompTabException
from app.services.vector_store import VectorStore


# Logging configuration
logger.add(
    "logs/promptab_{time}.log",
    rotation="1 day",
    retention="7 days",
    level=settings.LOG_LEVEL,
    format="{time} {level} {message}",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management"""
    logger.info("Starting PrompTab backend...")
    
    # Initialize vector store
    vector_store = VectorStore()
    await vector_store.initialize()
    app.state.vector_store = vector_store
    
    # Create tables (for development, use Alembic in production)
    if settings.ENVIRONMENT == "development":
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    
    logger.info("PrompTab backend started successfully!")
    
    yield
    
    # Cleanup resources
    logger.info("Shutting down PrompTab backend...")
    await vector_store.close()
    await engine.dispose()
    logger.info("PrompTab backend shut down successfully!")


# Initialize Sentry for error tracking
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        traces_sample_rate=0.1,
    )

# Create FastAPI application
app = FastAPI(
    title="PrompTab API",
    description="API for intelligent prompt optimization with RAG support",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Sentry middleware
if settings.SENTRY_DSN:
    app.add_middleware(SentryAsgiMiddleware)


# Global exception handler
@app.exception_handler(PrompTabException)
async def promptab_exception_handler(request: Request, exc: PrompTabException):
    """Custom exception handler"""
    logger.error(f"PrompTab exception: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "error_code": exc.error_code},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error_code": "INTERNAL_ERROR"},
    )


# Include routers
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to PrompTab API",
        "version": "1.0.0",
        "status": "operational",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check database connection
        async with engine.connect() as conn:
            await conn.execute("SELECT 1")
        
        return {
            "status": "healthy",
            "database": "connected",
            "vector_store": "initialized" if hasattr(app.state, "vector_store") else "not initialized",
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e),
            },
        )


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.BACKEND_RELOAD,
        log_level=settings.LOG_LEVEL.lower(),
    )

