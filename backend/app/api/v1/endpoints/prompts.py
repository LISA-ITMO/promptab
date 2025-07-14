"""
API endpoints for working with prompts
"""

from typing import List, Optional
from uuid import UUID, uuid4
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from loguru import logger

from app.api import deps
from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import PromptOptimizationError, ValidationError
from app.models.user import User
from app.models.prompt import UserPrompt, PromptHistory
from app.schemas.prompt import (
    PromptOptimizeRequest,
    PromptOptimizeResponse,
    UserPromptCreate,
    UserPromptUpdate,
    UserPrompt as UserPromptSchema,
    PromptHistory as PromptHistorySchema,
    PromptExportRequest,
    RAGSource,
    PromptStructure,
    PromptVariable
)
from app.services.prompt_optimizer import PromptOptimizer

router = APIRouter()


@router.post("/optimize", response_model=PromptOptimizeResponse)
async def optimize_prompt(
    request: PromptOptimizeRequest,
    current_user: User = Depends(deps.get_current_active_user),
    prompt_optimizer: PromptOptimizer = Depends(deps.get_prompt_optimizer),
    db: AsyncSession = Depends(get_db)
) -> PromptOptimizeResponse:
    """
    Optimize prompt using RAG and selected techniques
    
    - **prompt**: Original prompt text (required)
    - **techniques**: List of optimization techniques (optional, selected automatically)
    - **use_rag**: Use RAG for context enrichment (default true)
    - **llm_provider**: LLM provider for optimization (optional)
    - **language**: Prompt language - auto, ru or en (default auto)
    """
    try:
        # Create session ID for tracking
        session_id = uuid4()
        
        # Optimize prompt
        result = await prompt_optimizer.optimize(
            prompt=request.prompt,
            techniques=request.techniques,
            use_rag=request.use_rag,
            llm_provider=request.llm_provider,
            language=request.language
        )
        
        # Save to history
        history_entry = PromptHistory(
            user_id=current_user.id,
            session_id=session_id,
            original_prompt=result.original,
            optimized_prompt=result.optimized,
            llm_provider=result.metadata.get("provider"),
            llm_model=result.metadata.get("model"),
            optimization_techniques=result.techniques_used,
            rag_sources=[UUID(source["id"]) for source in result.rag_sources if "id" in source],
            response_time_ms=result.metadata.get("response_time_ms")
        )
        db.add(history_entry)
        await db.commit()
        
        # Form response
        return PromptOptimizeResponse(
            original=result.original,
            optimized=result.optimized,
            techniques_used=result.techniques_used,
            rag_sources=[
                RAGSource(**source) for source in result.rag_sources
            ],
            structure=PromptStructure(**result.structure),
            variables=[
                PromptVariable(**var) for var in result.variables
            ],
            metadata={
                **result.metadata,
                "session_id": str(session_id),
                "history_id": str(history_entry.id)
            }
        )
        
    except PromptOptimizationError as e:
        logger.error(f"Prompt optimization error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error during prompt optimization: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to optimize prompt"
        )


@router.post("/save", response_model=UserPromptSchema)
async def save_prompt(
    prompt_data: UserPromptCreate,
    current_user: User = Depends(deps.get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> UserPromptSchema:
    """
    Save optimized prompt
    
    - **title**: Prompt title
    - **original_prompt**: Original prompt
    - **optimized_prompt**: Optimized prompt
    - **variables**: List of variables in prompt
    - **is_template**: Is template
    - **is_public**: Public access
    """
    # Check limits
    if prompt_data.is_template:
        stmt = select(func.count(UserPrompt.id)).where(
            UserPrompt.user_id == current_user.id,
            UserPrompt.is_template == True
        )
        result = await db.execute(stmt)
        template_count = result.scalar()
        
        if template_count >= settings.MAX_TEMPLATES_PER_USER:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Template limit reached ({settings.MAX_TEMPLATES_PER_USER})"
            )
    
    # Create prompt
    db_prompt = UserPrompt(
        user_id=current_user.id,
        **prompt_data.model_dump()
    )
    db.add(db_prompt)
    await db.commit()
    await db.refresh(db_prompt)
    
    return UserPromptSchema.model_validate(db_prompt)


@router.get("/my", response_model=List[UserPromptSchema])
async def get_my_prompts(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    is_template: Optional[bool] = None,
    search: Optional[str] = None,
    current_user: User = Depends(deps.get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> List[UserPromptSchema]:
    """
    Get list of my saved prompts
    
    - **skip**: Number of skipped records
    - **limit**: Number of returned records (max 100)
    - **category**: Filter by category
    - **is_template**: Filter by templates
    - **search**: Search by title and tags
    """
    # Base query
    stmt = select(UserPrompt).where(UserPrompt.user_id == current_user.id)
    
    # Apply filters
    if category:
        stmt = stmt.where(UserPrompt.category == category)
    
    if is_template is not None:
        stmt = stmt.where(UserPrompt.is_template == is_template)
    
    if search:
        search_pattern = f"%{search}%"
        stmt = stmt.where(
            (UserPrompt.title.ilike(search_pattern)) |
            (UserPrompt.tags.any(search))
        )
    
    # Sorting and pagination
    stmt = stmt.order_by(UserPrompt.created_at.desc())
    stmt = stmt.offset(skip).limit(limit)
    
    # Execute query
    result = await db.execute(stmt)
    prompts = result.scalars().all()
    
    return [UserPromptSchema.model_validate(p) for p in prompts]


@router.get("/{prompt_id}", response_model=UserPromptSchema)
async def get_prompt(
    prompt_id: UUID,
    current_user: User = Depends(deps.get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> UserPromptSchema:
    """Get specific prompt by ID"""
    # Get prompt
    stmt = select(UserPrompt).where(
        UserPrompt.id == prompt_id,
        (UserPrompt.user_id == current_user.id) | (UserPrompt.is_public == True)
    )
    result = await db.execute(stmt)
    prompt = result.scalar_one_or_none()
    
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )
    
    # Increase usage counter
    prompt.usage_count += 1
    await db.commit()
    
    return UserPromptSchema.model_validate(prompt)


@router.put("/{prompt_id}", response_model=UserPromptSchema)
async def update_prompt(
    prompt_id: UUID,
    prompt_update: UserPromptUpdate,
    current_user: User = Depends(deps.get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> UserPromptSchema:
    """Update saved prompt"""
    # Get prompt
    stmt = select(UserPrompt).where(
        UserPrompt.id == prompt_id,
        UserPrompt.user_id == current_user.id
    )
    result = await db.execute(stmt)
    prompt = result.scalar_one_or_none()
    
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )
    
    # Update fields
    update_data = prompt_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(prompt, field, value)
    
    await db.commit()
    await db.refresh(prompt)
    
    return UserPromptSchema.model_validate(prompt)


@router.delete("/{prompt_id}")
async def delete_prompt(
    prompt_id: UUID,
    current_user: User = Depends(deps.get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Delete saved prompt"""
    # Get prompt
    stmt = select(UserPrompt).where(
        UserPrompt.id == prompt_id,
        UserPrompt.user_id == current_user.id
    )
    result = await db.execute(stmt)
    prompt = result.scalar_one_or_none()
    
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )
    
    # Delete
    await db.delete(prompt)
    await db.commit()
    
    return {"detail": "Prompt deleted successfully"}


@router.get("/public/explore", response_model=List[UserPromptSchema])
async def explore_public_prompts(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    sort_by: str = Query("usage_count", pattern="^(usage_count|created_at|updated_at)$"),
    db: AsyncSession = Depends(get_db)
) -> List[UserPromptSchema]:
    """
    Explore public prompts and templates
    
    - **skip**: Number of skipped records
    - **limit**: Number of returned records
    - **category**: Filter by category
    - **sort_by**: Sorting (usage_count, created_at, updated_at)
    """
    # Query public prompts
    stmt = select(UserPrompt).where(UserPrompt.is_public == True)
    
    # Filters
    if category:
        stmt = stmt.where(UserPrompt.category == category)
    
    # Sorting
    if sort_by == "usage_count":
        stmt = stmt.order_by(UserPrompt.usage_count.desc())
    elif sort_by == "created_at":
        stmt = stmt.order_by(UserPrompt.created_at.desc())
    else:
        stmt = stmt.order_by(UserPrompt.updated_at.desc())
    
    # Pagination
    stmt = stmt.offset(skip).limit(limit)
    
    # Execution
    result = await db.execute(stmt)
    prompts = result.scalars().all()
    
    return [UserPromptSchema.model_validate(p) for p in prompts]
