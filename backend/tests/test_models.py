"""
Unit tests for database models
"""
import pytest
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.models.prompt import UserPrompt, PromptHistory
from app.models.variable import Variable, VariableCategory


class TestUserModel:
    """Test cases for User model."""

    @pytest.mark.asyncio
    async def test_create_user(self, db_session: AsyncSession):
        """Test user creation."""
        # Arrange
        user = User(
            email="test@example.com",
            hashed_password="hashed_password",
            full_name="Test User",
            is_active=True,
            is_verified=True
        )

        # Act
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        # Assert
        assert user.id is not None
        assert user.email == "test@example.com"
        assert user.full_name == "Test User"
        assert user.is_active is True
        assert user.is_verified is True
        assert user.created_at is not None
        assert user.updated_at is not None

    @pytest.mark.asyncio
    async def test_user_repr(self, db_session: AsyncSession):
        """Test user string representation."""
        # Arrange
        user = User(
            email="test@example.com",
            hashed_password="hashed_password"
        )
        db_session.add(user)
        await db_session.commit()

        # Act
        user_repr = repr(user)

        # Assert
        assert "User" in user_repr
        assert "test@example.com" in user_repr
        assert str(user.id) in user_repr

    @pytest.mark.asyncio
    async def test_user_unique_email(self, db_session: AsyncSession):
        """Test user email uniqueness constraint."""
        # Arrange
        user1 = User(
            email="test@example.com",
            hashed_password="hashed_password"
        )
        user2 = User(
            email="test@example.com",  # Same email
            hashed_password="hashed_password"
        )

        # Act & Assert
        db_session.add(user1)
        await db_session.commit()

        db_session.add(user2)
        with pytest.raises(Exception):  # Should raise unique constraint violation
            await db_session.commit()

    @pytest.mark.asyncio
    async def test_user_default_values(self, db_session: AsyncSession):
        """Test user default values."""
        # Arrange
        user = User(
            email="test@example.com",
            hashed_password="hashed_password"
        )

        # Act
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        # Assert
        assert user.is_active is True
        assert user.is_verified is False
        assert user.is_superuser is False
        assert user.created_at is not None
        assert user.updated_at is not None

    @pytest.mark.asyncio
    async def test_user_relationships(self, db_session: AsyncSession):
        """Test user relationships."""
        # Arrange
        user = User(
            email="test@example.com",
            hashed_password="hashed_password"
        )
        db_session.add(user)
        await db_session.commit()

        # Create related data
        prompt = UserPrompt(
            user_id=user.id,
            title="Test Prompt",
            original_prompt="Original",
            optimized_prompt="Optimized"
        )
        db_session.add(prompt)
        await db_session.commit()

        # Act
        await db_session.refresh(user)

        # Assert
        assert len(user.prompts) == 1
        assert user.prompts[0].title == "Test Prompt"


class TestUserPromptModel:
    """Test cases for UserPrompt model."""

    @pytest.mark.asyncio
    async def test_create_prompt(self, db_session: AsyncSession, test_user: User):
        """Test prompt creation."""
        # Arrange
        prompt = UserPrompt(
            user_id=test_user.id,
            title="Test Prompt",
            original_prompt="Original prompt text",
            optimized_prompt="Optimized prompt text",
            variables=[{"name": "test_var", "description": "Test variable"}],
            category="writing",
            tags=["test", "blog"],
            is_template=True,
            is_public=False
        )

        # Act
        db_session.add(prompt)
        await db_session.commit()
        await db_session.refresh(prompt)

        # Assert
        assert prompt.id is not None
        assert prompt.title == "Test Prompt"
        assert prompt.original_prompt == "Original prompt text"
        assert prompt.optimized_prompt == "Optimized prompt text"
        assert prompt.variables == [{"name": "test_var", "description": "Test variable"}]
        assert prompt.category == "writing"
        assert prompt.tags == ["test", "blog"]
        assert prompt.is_template is True
        assert prompt.is_public is False
        assert prompt.usage_count == 0
        assert prompt.created_at is not None
        assert prompt.updated_at is not None

    @pytest.mark.asyncio
    async def test_prompt_repr(self, db_session: AsyncSession, test_user: User):
        """Test prompt string representation."""
        # Arrange
        prompt = UserPrompt(
            user_id=test_user.id,
            title="Test Prompt",
            original_prompt="Original",
            optimized_prompt="Optimized"
        )
        db_session.add(prompt)
        await db_session.commit()

        # Act
        prompt_repr = repr(prompt)

        # Assert
        assert "UserPrompt" in prompt_repr
        assert "Test Prompt" in prompt_repr
        assert str(prompt.id) in prompt_repr

    @pytest.mark.asyncio
    async def test_prompt_default_values(self, db_session: AsyncSession, test_user: User):
        """Test prompt default values."""
        # Arrange
        prompt = UserPrompt(
            user_id=test_user.id,
            title="Test Prompt",
            original_prompt="Original",
            optimized_prompt="Optimized"
        )

        # Act
        db_session.add(prompt)
        await db_session.commit()
        await db_session.refresh(prompt)

        # Assert
        assert prompt.variables == []
        assert prompt.tags == []
        assert prompt.is_template is False
        assert prompt.is_public is False
        assert prompt.usage_count == 0

    @pytest.mark.asyncio
    async def test_prompt_relationships(self, db_session: AsyncSession, test_user: User):
        """Test prompt relationships."""
        # Arrange
        prompt = UserPrompt(
            user_id=test_user.id,
            title="Test Prompt",
            original_prompt="Original",
            optimized_prompt="Optimized"
        )
        db_session.add(prompt)
        await db_session.commit()

        # Act
        await db_session.refresh(test_user)

        # Assert
        assert len(test_user.prompts) == 1
        assert test_user.prompts[0].title == "Test Prompt"

    @pytest.mark.asyncio
    async def test_prompt_usage_count_increment(self, db_session: AsyncSession, test_user: User):
        """Test prompt usage count increment."""
        # Arrange
        prompt = UserPrompt(
            user_id=test_user.id,
            title="Test Prompt",
            original_prompt="Original",
            optimized_prompt="Optimized"
        )
        db_session.add(prompt)
        await db_session.commit()

        # Act
        prompt.usage_count += 1
        await db_session.commit()
        await db_session.refresh(prompt)

        # Assert
        assert prompt.usage_count == 1


class TestPromptHistoryModel:
    """Test cases for PromptHistory model."""

    @pytest.mark.asyncio
    async def test_create_history(self, db_session: AsyncSession, test_user: User):
        """Test history creation."""
        # Arrange
        history = PromptHistory(
            user_id=test_user.id,
            session_id="test_session",
            original_prompt="Original prompt",
            optimized_prompt="Optimized prompt",
            techniques_used=["rag", "chain_of_thought"],
            rag_sources=[{"id": "1", "content": "Source 1"}],
            variables=[{"name": "test_var"}],
            metadata={"model": "gpt-4", "tokens": 150}
        )

        # Act
        db_session.add(history)
        await db_session.commit()
        await db_session.refresh(history)

        # Assert
        assert history.id is not None
        assert history.session_id == "test_session"
        assert history.original_prompt == "Original prompt"
        assert history.optimized_prompt == "Optimized prompt"
        assert history.techniques_used == ["rag", "chain_of_thought"]
        assert history.rag_sources == [{"id": "1", "content": "Source 1"}]
        assert history.variables == [{"name": "test_var"}]
        assert history.metadata == {"model": "gpt-4", "tokens": 150}
        assert history.created_at is not None

    @pytest.mark.asyncio
    async def test_history_repr(self, db_session: AsyncSession, test_user: User):
        """Test history string representation."""
        # Arrange
        history = PromptHistory(
            user_id=test_user.id,
            session_id="test_session",
            original_prompt="Original",
            optimized_prompt="Optimized"
        )
        db_session.add(history)
        await db_session.commit()

        # Act
        history_repr = repr(history)

        # Assert
        assert "PromptHistory" in history_repr
        assert "test_session" in history_repr
        assert str(history.id) in history_repr


class TestVariableCategoryModel:
    """Test cases for VariableCategory model."""

    @pytest.mark.asyncio
    async def test_create_category(self, db_session: AsyncSession, test_user: User):
        """Test category creation."""
        # Arrange
        category = VariableCategory(
            user_id=test_user.id,
            name="Test Category",
            description="Test category description",
            color="#3B82F6",
            icon="folder"
        )

        # Act
        db_session.add(category)
        await db_session.commit()
        await db_session.refresh(category)

        # Assert
        assert category.id is not None
        assert category.name == "Test Category"
        assert category.description == "Test category description"
        assert category.color == "#3B82F6"
        assert category.icon == "folder"
        assert category.usage_count == 0
        assert category.created_at is not None
        assert category.updated_at is not None

    @pytest.mark.asyncio
    async def test_category_repr(self, db_session: AsyncSession, test_user: User):
        """Test category string representation."""
        # Arrange
        category = VariableCategory(
            user_id=test_user.id,
            name="Test Category"
        )
        db_session.add(category)
        await db_session.commit()

        # Act
        category_repr = repr(category)

        # Assert
        assert "VariableCategory" in category_repr
        assert "Test Category" in category_repr
        assert str(category.id) in category_repr

    @pytest.mark.asyncio
    async def test_category_unique_name_per_user(self, db_session: AsyncSession, test_user: User):
        """Test category name uniqueness per user."""
        # Arrange
        category1 = VariableCategory(
            user_id=test_user.id,
            name="Test Category"
        )
        category2 = VariableCategory(
            user_id=test_user.id,
            name="Test Category"  # Same name for same user
        )

        # Act & Assert
        db_session.add(category1)
        await db_session.commit()

        db_session.add(category2)
        with pytest.raises(Exception):  # Should raise unique constraint violation
            await db_session.commit()

    @pytest.mark.asyncio
    async def test_category_default_values(self, db_session: AsyncSession, test_user: User):
        """Test category default values."""
        # Arrange
        category = VariableCategory(
            user_id=test_user.id,
            name="Test Category"
        )

        # Act
        db_session.add(category)
        await db_session.commit()
        await db_session.refresh(category)

        # Assert
        assert category.color == "#3B82F6"
        assert category.usage_count == 0

    @pytest.mark.asyncio
    async def test_category_relationships(self, db_session: AsyncSession, test_user: User):
        """Test category relationships."""
        # Arrange
        category = VariableCategory(
            user_id=test_user.id,
            name="Test Category"
        )
        db_session.add(category)
        await db_session.commit()

        # Create related variable
        variable = Variable(
            user_id=test_user.id,
            name="test_variable",
            category_id=category.id
        )
        db_session.add(variable)
        await db_session.commit()

        # Act
        await db_session.refresh(category)

        # Assert
        assert len(category.variables) == 1
        assert category.variables[0].name == "test_variable"


class TestVariableModel:
    """Test cases for Variable model."""

    @pytest.mark.asyncio
    async def test_create_variable(self, db_session: AsyncSession, test_user: User, test_variable_category: VariableCategory):
        """Test variable creation."""
        # Arrange
        variable = Variable(
            user_id=test_user.id,
            name="test_variable",
            description="Test variable description",
            default_value="test_value",
            type="text",
            category_id=test_variable_category.id,
            is_required=True
        )

        # Act
        db_session.add(variable)
        await db_session.commit()
        await db_session.refresh(variable)

        # Assert
        assert variable.id is not None
        assert variable.name == "test_variable"
        assert variable.description == "Test variable description"
        assert variable.default_value == "test_value"
        assert variable.type == "text"
        assert variable.category_id == test_variable_category.id
        assert variable.is_required is True
        assert variable.usage_count == 0
        assert variable.created_at is not None
        assert variable.updated_at is not None

    @pytest.mark.asyncio
    async def test_variable_repr(self, db_session: AsyncSession, test_user: User):
        """Test variable string representation."""
        # Arrange
        variable = Variable(
            user_id=test_user.id,
            name="test_variable"
        )
        db_session.add(variable)
        await db_session.commit()

        # Act
        variable_repr = repr(variable)

        # Assert
        assert "Variable" in variable_repr
        assert "test_variable" in variable_repr
        assert str(variable.id) in variable_repr

    @pytest.mark.asyncio
    async def test_variable_unique_name_per_user(self, db_session: AsyncSession, test_user: User):
        """Test variable name uniqueness per user."""
        # Arrange
        variable1 = Variable(
            user_id=test_user.id,
            name="test_variable"
        )
        variable2 = Variable(
            user_id=test_user.id,
            name="test_variable"  # Same name for same user
        )

        # Act & Assert
        db_session.add(variable1)
        await db_session.commit()

        db_session.add(variable2)
        with pytest.raises(Exception):  # Should raise unique constraint violation
            await db_session.commit()

    @pytest.mark.asyncio
    async def test_variable_default_values(self, db_session: AsyncSession, test_user: User):
        """Test variable default values."""
        # Arrange
        variable = Variable(
            user_id=test_user.id,
            name="test_variable"
        )

        # Act
        db_session.add(variable)
        await db_session.commit()
        await db_session.refresh(variable)

        # Assert
        assert variable.type == "text"
        assert variable.is_required is False
        assert variable.usage_count == 0

    @pytest.mark.asyncio
    async def test_variable_relationships(self, db_session: AsyncSession, test_user: User, test_variable_category: VariableCategory):
        """Test variable relationships."""
        # Arrange
        variable = Variable(
            user_id=test_user.id,
            name="test_variable",
            category_id=test_variable_category.id
        )
        db_session.add(variable)
        await db_session.commit()

        # Act
        await db_session.refresh(test_variable_category)

        # Assert
        assert len(test_variable_category.variables) == 1
        assert test_variable_category.variables[0].name == "test_variable"

    @pytest.mark.asyncio
    async def test_variable_usage_count_increment(self, db_session: AsyncSession, test_user: User):
        """Test variable usage count increment."""
        # Arrange
        variable = Variable(
            user_id=test_user.id,
            name="test_variable"
        )
        db_session.add(variable)
        await db_session.commit()

        # Act
        variable.usage_count += 1
        await db_session.commit()
        await db_session.refresh(variable)

        # Assert
        assert variable.usage_count == 1

    @pytest.mark.asyncio
    async def test_variable_name_validation(self, db_session: AsyncSession, test_user: User):
        """Test variable name validation."""
        # Arrange
        variable = Variable(
            user_id=test_user.id,
            name="test-variable"  # Invalid name with hyphen
        )

        # Act & Assert
        db_session.add(variable)
        with pytest.raises(Exception):  # Should raise validation error
            await db_session.commit()

    @pytest.mark.asyncio
    async def test_variable_name_valid(self, db_session: AsyncSession, test_user: User):
        """Test valid variable name."""
        # Arrange
        variable = Variable(
            user_id=test_user.id,
            name="test_variable_123"  # Valid name
        )

        # Act
        db_session.add(variable)
        await db_session.commit()

        # Assert
        assert variable.name == "test_variable_123" 