"""
API v1 Router Configuration
"""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, prompts, users, variables, templates, history

api_router = APIRouter()

# Connect routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(prompts.router, prefix="/prompts", tags=["prompts"])
api_router.include_router(variables.router, prefix="/variables", tags=["variables"])
api_router.include_router(templates.router, prefix="/templates", tags=["templates"])
api_router.include_router(history.router, prefix="/history", tags=["history"])

