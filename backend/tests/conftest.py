"""
Pytest configuration and fixtures for PrompTab backend tests
"""
import pytest
import asyncio
from typing import AsyncGenerator, Generator
from unittest.mock import AsyncMock, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from httpx import AsyncClient

from app.core.config import settings
from app.core.database import get_db, Base
from app.main import app
from app.models.user import User
from app.models.prompt import UserPrompt
from app.models.variable import Variable, VariableCategory
from app.core.security import create_access_token
from app.services.llm_service import LLMService
from app.services.vector_store import VectorStore
from app.services.prompt_optimizer import PromptOptimizer


# Test database URL
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

# Create test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    poolclass=StaticPool,
    connect_args={"check_same_thread": False},
)

# Create test session factory
TestingSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
async def setup_database() -> AsyncGenerator[None, None]:
    """Setup test database with tables."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    async with TestingSessionLocal() as session:
        yield session


@pytest.fixture
def client() -> Generator:
    """Create a test client."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Create an async test client."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def mock_llm_service() -> MagicMock:
    """Mock LLM service."""
    mock = MagicMock(spec=LLMService)
    mock.generate_response = AsyncMock(return_value="Mocked response")
    mock.analyze_prompt = AsyncMock(return_value={
        "intent": "general",
        "category": "writing",
        "complexity": "medium"
    })
    return mock


@pytest.fixture
def mock_vector_store() -> MagicMock:
    """Mock vector store service."""
    mock = MagicMock(spec=VectorStore)
    mock.search = AsyncMock(return_value=[
        {"id": "1", "content": "Mock content", "similarity": 0.8}
    ])
    mock.add_document = AsyncMock()
    return mock


@pytest.fixture
def mock_prompt_optimizer() -> MagicMock:
    """Mock prompt optimizer service."""
    mock = MagicMock(spec=PromptOptimizer)
    mock.optimize = AsyncMock(return_value={
        "original": "Test prompt",
        "optimized": "Optimized test prompt",
        "techniques_used": ["rag", "chain_of_thought"],
        "rag_sources": [],
        "structure": {
            "role": "assistant",
            "task": "help",
            "context": "",
            "instructions": "Optimized test prompt",
            "constraints": "",
            "tone": "professional"
        },
        "variables": [],
        "metadata": {}
    })
    return mock


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user."""
    user = User(
        email="test@example.com",
        hashed_password="hashed_password",
        is_active=True,
        is_verified=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
def test_user_token(test_user: User) -> str:
    """Create access token for test user."""
    return create_access_token(data={"sub": str(test_user.id)})


@pytest.fixture
async def test_prompt(db_session: AsyncSession, test_user: User) -> UserPrompt:
    """Create a test prompt."""
    prompt = UserPrompt(
        user_id=test_user.id,
        title="Test Prompt",
        original_prompt="Original test prompt",
        optimized_prompt="Optimized test prompt",
        is_template=True,
        is_public=False
    )
    db_session.add(prompt)
    await db_session.commit()
    await db_session.refresh(prompt)
    return prompt


@pytest.fixture
async def test_variable_category(db_session: AsyncSession, test_user: User) -> VariableCategory:
    """Create a test variable category."""
    category = VariableCategory(
        user_id=test_user.id,
        name="Test Category",
        description="Test category description"
    )
    db_session.add(category)
    await db_session.commit()
    await db_session.refresh(category)
    return category


@pytest.fixture
async def test_variable(db_session: AsyncSession, test_user: User, test_variable_category: VariableCategory) -> Variable:
    """Create a test variable."""
    variable = Variable(
        user_id=test_user.id,
        name="test_variable",
        description="Test variable description",
        default_value="test_value",
        category_id=test_variable_category.id
    )
    db_session.add(variable)
    await db_session.commit()
    await db_session.refresh(variable)
    return variable


# Override database dependency for testing
async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    """Override database dependency for testing."""
    async with TestingSessionLocal() as session:
        yield session


# Apply override
app.dependency_overrides[get_db] = override_get_db 