"""
Unit tests for prompts API endpoints
"""
import pytest
from unittest.mock import AsyncMock, patch
from fastapi import status
from httpx import AsyncClient

from app.models.user import User
from app.models.prompt import UserPrompt


class TestPromptsAPI:
    """Test cases for prompts API endpoints."""

    @pytest.mark.asyncio
    async def test_optimize_prompt_success(
        self, 
        async_client: AsyncClient, 
        test_user: User, 
        test_user_token: str,
        mock_prompt_optimizer: AsyncMock
    ):
        """Test successful prompt optimization."""
        # Arrange
        with patch('app.api.v1.endpoints.prompts.PromptOptimizer') as mock_optimizer_class:
            mock_optimizer_instance = AsyncMock()
            mock_optimizer_instance.optimize = AsyncMock(return_value={
                "original": "Write a blog post",
                "optimized": "Enhanced blog post prompt",
                "techniques_used": ["rag", "chain_of_thought"],
                "rag_sources": [],
                "structure": {
                    "role": "assistant",
                    "task": "help",
                    "context": "",
                    "instructions": "Enhanced blog post prompt",
                    "constraints": "",
                    "tone": "professional"
                },
                "variables": [],
                "metadata": {}
            })
            mock_optimizer_class.return_value = mock_optimizer_instance

            # Act
            response = await async_client.post(
                "/api/v1/prompts/optimize",
                headers={"Authorization": f"Bearer {test_user_token}"},
                json={"prompt": "Write a blog post"}
            )

        # Assert
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["original"] == "Write a blog post"
        assert data["optimized"] == "Enhanced blog post prompt"
        assert "rag" in data["techniques_used"]
        assert "chain_of_thought" in data["techniques_used"]

    @pytest.mark.asyncio
    async def test_optimize_prompt_unauthorized(self, async_client: AsyncClient):
        """Test prompt optimization without authentication."""
        # Act
        response = await async_client.post(
            "/api/v1/prompts/optimize",
            json={"prompt": "Write a blog post"}
        )

        # Assert
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_optimize_prompt_invalid_data(self, async_client: AsyncClient, test_user_token: str):
        """Test prompt optimization with invalid data."""
        # Act
        response = await async_client.post(
            "/api/v1/prompts/optimize",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={"invalid_field": "value"}
        )

        # Assert
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.asyncio
    async def test_optimize_prompt_empty_prompt(self, async_client: AsyncClient, test_user_token: str):
        """Test prompt optimization with empty prompt."""
        # Act
        response = await async_client.post(
            "/api/v1/prompts/optimize",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={"prompt": ""}
        )

        # Assert
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.asyncio
    async def test_save_prompt_success(
        self, 
        async_client: AsyncClient, 
        test_user: User, 
        test_user_token: str
    ):
        """Test successful prompt saving."""
        # Arrange
        prompt_data = {
            "title": "Test Prompt",
            "original_prompt": "Original prompt",
            "optimized_prompt": "Optimized prompt",
            "variables": [],
            "category": "writing",
            "tags": ["test", "blog"],
            "is_template": True,
            "is_public": False
        }

        # Act
        response = await async_client.post(
            "/api/v1/prompts/save",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json=prompt_data
        )

        # Assert
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["title"] == "Test Prompt"
        assert data["user_id"] == str(test_user.id)
        assert data["is_template"] is True
        assert data["is_public"] is False

    @pytest.mark.asyncio
    async def test_save_prompt_missing_title(self, async_client: AsyncClient, test_user_token: str):
        """Test prompt saving with missing title."""
        # Arrange
        prompt_data = {
            "original_prompt": "Original prompt",
            "optimized_prompt": "Optimized prompt"
        }

        # Act
        response = await async_client.post(
            "/api/v1/prompts/save",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json=prompt_data
        )

        # Assert
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.asyncio
    async def test_get_my_prompts_success(
        self, 
        async_client: AsyncClient, 
        test_user: User, 
        test_user_token: str,
        test_prompt: UserPrompt
    ):
        """Test successful retrieval of user prompts."""
        # Act
        response = await async_client.get(
            "/api/v1/prompts/my",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )

        # Assert
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["title"] == "Test Prompt"
        assert data[0]["user_id"] == str(test_user.id)

    @pytest.mark.asyncio
    async def test_get_my_prompts_with_filters(
        self, 
        async_client: AsyncClient, 
        test_user: User, 
        test_user_token: str,
        test_prompt: UserPrompt
    ):
        """Test retrieval of user prompts with filters."""
        # Act
        response = await async_client.get(
            "/api/v1/prompts/my?is_template=true&limit=10",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )

        # Assert
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 10
        for prompt in data:
            assert prompt["is_template"] is True

    @pytest.mark.asyncio
    async def test_get_my_prompts_unauthorized(self, async_client: AsyncClient):
        """Test retrieval of prompts without authentication."""
        # Act
        response = await async_client.get("/api/v1/prompts/my")

        # Assert
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_get_prompt_by_id_success(
        self, 
        async_client: AsyncClient, 
        test_user: User, 
        test_user_token: str,
        test_prompt: UserPrompt
    ):
        """Test successful retrieval of prompt by ID."""
        # Act
        response = await async_client.get(
            f"/api/v1/prompts/{test_prompt.id}",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )

        # Assert
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == str(test_prompt.id)
        assert data["title"] == "Test Prompt"
        assert data["user_id"] == str(test_user.id)

    @pytest.mark.asyncio
    async def test_get_prompt_by_id_not_found(
        self, 
        async_client: AsyncClient, 
        test_user_token: str
    ):
        """Test retrieval of non-existent prompt."""
        # Act
        response = await async_client.get(
            "/api/v1/prompts/00000000-0000-0000-0000-000000000000",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )

        # Assert
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio
    async def test_update_prompt_success(
        self, 
        async_client: AsyncClient, 
        test_user: User, 
        test_user_token: str,
        test_prompt: UserPrompt
    ):
        """Test successful prompt update."""
        # Arrange
        update_data = {
            "title": "Updated Test Prompt",
            "original_prompt": "Updated original prompt",
            "optimized_prompt": "Updated optimized prompt",
            "category": "updated_category"
        }

        # Act
        response = await async_client.put(
            f"/api/v1/prompts/{test_prompt.id}",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json=update_data
        )

        # Assert
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["title"] == "Updated Test Prompt"
        assert data["original_prompt"] == "Updated original prompt"
        assert data["category"] == "updated_category"

    @pytest.mark.asyncio
    async def test_update_prompt_not_found(
        self, 
        async_client: AsyncClient, 
        test_user_token: str
    ):
        """Test update of non-existent prompt."""
        # Arrange
        update_data = {"title": "Updated Title"}

        # Act
        response = await async_client.put(
            "/api/v1/prompts/00000000-0000-0000-0000-000000000000",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json=update_data
        )

        # Assert
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio
    async def test_delete_prompt_success(
        self, 
        async_client: AsyncClient, 
        test_user: User, 
        test_user_token: str,
        test_prompt: UserPrompt
    ):
        """Test successful prompt deletion."""
        # Act
        response = await async_client.delete(
            f"/api/v1/prompts/{test_prompt.id}",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )

        # Assert
        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verify prompt is deleted
        get_response = await async_client.get(
            f"/api/v1/prompts/{test_prompt.id}",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert get_response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio
    async def test_delete_prompt_not_found(
        self, 
        async_client: AsyncClient, 
        test_user_token: str
    ):
        """Test deletion of non-existent prompt."""
        # Act
        response = await async_client.delete(
            "/api/v1/prompts/00000000-0000-0000-0000-000000000000",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )

        # Assert
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio
    async def test_get_public_prompts_success(self, async_client: AsyncClient):
        """Test successful retrieval of public prompts."""
        # Act
        response = await async_client.get("/api/v1/prompts/public/explore")

        # Assert
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)

    @pytest.mark.asyncio
    async def test_get_public_prompts_with_filters(self, async_client: AsyncClient):
        """Test retrieval of public prompts with filters."""
        # Act
        response = await async_client.get(
            "/api/v1/prompts/public/explore?category=writing&sort_by=usage_count&limit=5"
        )

        # Assert
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 5

    @pytest.mark.asyncio
    async def test_get_prompt_history_success(
        self, 
        async_client: AsyncClient, 
        test_user: User, 
        test_user_token: str
    ):
        """Test successful retrieval of prompt history."""
        # Act
        response = await async_client.get(
            "/api/v1/history",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )

        # Assert
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)

    @pytest.mark.asyncio
    async def test_get_prompt_history_with_filters(
        self, 
        async_client: AsyncClient, 
        test_user: User, 
        test_user_token: str
    ):
        """Test retrieval of prompt history with filters."""
        # Act
        response = await async_client.get(
            "/api/v1/history?limit=10&skip=0",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )

        # Assert
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 10

    @pytest.mark.asyncio
    async def test_export_prompts_success(
        self, 
        async_client: AsyncClient, 
        test_user: User, 
        test_user_token: str,
        test_prompt: UserPrompt
    ):
        """Test successful prompt export."""
        # Arrange
        export_data = {
            "prompt_ids": [str(test_prompt.id)],
            "format": "json"
        }

        # Act
        response = await async_client.post(
            "/api/v1/prompts/export",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json=export_data
        )

        # Assert
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "download_url" in data
        assert data["format"] == "json"

    @pytest.mark.asyncio
    async def test_export_prompts_invalid_format(
        self, 
        async_client: AsyncClient, 
        test_user_token: str
    ):
        """Test prompt export with invalid format."""
        # Arrange
        export_data = {
            "prompt_ids": ["00000000-0000-0000-0000-000000000000"],
            "format": "invalid_format"
        }

        # Act
        response = await async_client.post(
            "/api/v1/prompts/export",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json=export_data
        )

        # Assert
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY 