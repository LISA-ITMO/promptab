"""
Unit tests for service layer (LLM, VectorStore, etc.)
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.llm_service import LLMService
from app.services.vector_store import VectorStore
from app.core.exceptions import LLMServiceError, VectorStoreError


class TestLLMService:
    """Test cases for LLMService."""

    @pytest.fixture
    def llm_service(self):
        """Create LLMService instance with mocked dependencies."""
        with patch('app.services.llm_service.openai') as mock_openai, \
             patch('app.services.llm_service.anthropic') as mock_anthropic:
            
            mock_openai.AsyncOpenAI.return_value = MagicMock()
            mock_anthropic.AsyncAnthropic.return_value = MagicMock()
            
            return LLMService()

    @pytest.mark.asyncio
    async def test_generate_response_openai_success(self, llm_service):
        """Test successful response generation with OpenAI."""
        # Arrange
        prompt = "Write a blog post about AI"
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Generated blog post content"
        
        llm_service.openai_client.chat.completions.create = AsyncMock(return_value=mock_response)

        # Act
        result = await llm_service.generate_response(prompt)

        # Assert
        assert result == "Generated blog post content"
        llm_service.openai_client.chat.completions.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_generate_response_anthropic_success(self, llm_service):
        """Test successful response generation with Anthropic."""
        # Arrange
        prompt = "Write a blog post about AI"
        llm_service.provider = "anthropic"
        
        mock_response = MagicMock()
        mock_response.content = [MagicMock()]
        mock_response.content[0].text = "Generated blog post content"
        
        llm_service.anthropic_client.messages.create = AsyncMock(return_value=mock_response)

        # Act
        result = await llm_service.generate_response(prompt)

        # Assert
        assert result == "Generated blog post content"
        llm_service.anthropic_client.messages.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_generate_response_invalid_provider(self, llm_service):
        """Test response generation with invalid provider."""
        # Arrange
        prompt = "Write a blog post about AI"
        llm_service.provider = "invalid_provider"

        # Act & Assert
        with pytest.raises(LLMServiceError, match="Unsupported LLM provider"):
            await llm_service.generate_response(prompt)

    @pytest.mark.asyncio
    async def test_generate_response_openai_error(self, llm_service):
        """Test OpenAI error handling."""
        # Arrange
        prompt = "Write a blog post about AI"
        llm_service.openai_client.chat.completions.create = AsyncMock(
            side_effect=Exception("OpenAI API error")
        )

        # Act & Assert
        with pytest.raises(LLMServiceError, match="Failed to generate response"):
            await llm_service.generate_response(prompt)

    @pytest.mark.asyncio
    async def test_analyze_prompt_success(self, llm_service):
        """Test successful prompt analysis."""
        # Arrange
        prompt = "Write a blog post about AI"
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = '{"intent": "generation", "category": "writing", "complexity": "medium"}'
        
        llm_service.openai_client.chat.completions.create = AsyncMock(return_value=mock_response)

        # Act
        result = await llm_service.analyze_prompt(prompt)

        # Assert
        assert result["intent"] == "generation"
        assert result["category"] == "writing"
        assert result["complexity"] == "medium"

    @pytest.mark.asyncio
    async def test_analyze_prompt_invalid_json(self, llm_service):
        """Test prompt analysis with invalid JSON response."""
        # Arrange
        prompt = "Write a blog post about AI"
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Invalid JSON"
        
        llm_service.openai_client.chat.completions.create = AsyncMock(return_value=mock_response)

        # Act & Assert
        with pytest.raises(LLMServiceError, match="Failed to parse analysis response"):
            await llm_service.analyze_prompt(prompt)

    @pytest.mark.asyncio
    async def test_switch_provider(self, llm_service):
        """Test provider switching."""
        # Arrange
        llm_service.provider = "openai"

        # Act
        llm_service.switch_provider("anthropic")

        # Assert
        assert llm_service.provider == "anthropic"

    @pytest.mark.asyncio
    async def test_switch_provider_invalid(self, llm_service):
        """Test switching to invalid provider."""
        # Arrange
        llm_service.provider = "openai"

        # Act & Assert
        with pytest.raises(LLMServiceError, match="Unsupported LLM provider"):
            llm_service.switch_provider("invalid_provider")

    @pytest.mark.asyncio
    async def test_get_available_models(self, llm_service):
        """Test getting available models."""
        # Act
        models = llm_service.get_available_models()

        # Assert
        assert "openai" in models
        assert "anthropic" in models
        assert "ollama" in models
        assert isinstance(models["openai"], list)
        assert isinstance(models["anthropic"], list)

    @pytest.mark.asyncio
    async def test_validate_prompt(self, llm_service):
        """Test prompt validation."""
        # Valid cases
        assert llm_service._validate_prompt("Valid prompt") is None
        assert llm_service._validate_prompt("A" * 1000) is None

        # Invalid cases
        with pytest.raises(LLMServiceError, match="Prompt cannot be empty"):
            llm_service._validate_prompt("")

        with pytest.raises(LLMServiceError, match="Prompt too long"):
            llm_service._validate_prompt("A" * 10000)

    @pytest.mark.asyncio
    async def test_build_system_prompt(self, llm_service):
        """Test system prompt building."""
        # Arrange
        context = "You are a helpful assistant"
        instructions = "Write in a professional tone"

        # Act
        system_prompt = llm_service._build_system_prompt(context, instructions)

        # Assert
        assert context in system_prompt
        assert instructions in system_prompt
        assert "system" in system_prompt.lower()

    @pytest.mark.asyncio
    async def test_estimate_tokens(self, llm_service):
        """Test token estimation."""
        # Arrange
        text = "This is a test text for token estimation"

        # Act
        token_count = llm_service._estimate_tokens(text)

        # Assert
        assert isinstance(token_count, int)
        assert token_count > 0
        assert token_count <= len(text.split()) * 1.5  # Rough estimation


class TestVectorStore:
    """Test cases for VectorStore service."""

    @pytest.fixture
    def vector_store(self):
        """Create VectorStore instance with mocked dependencies."""
        with patch('app.services.vector_store.Chroma') as mock_chroma, \
             patch('app.services.vector_store.sentence_transformers') as mock_sentence_transformers:
            
            mock_chroma.return_value = MagicMock()
            mock_sentence_transformers.SentenceTransformer.return_value = MagicMock()
            
            return VectorStore()

    @pytest.mark.asyncio
    async def test_add_document_success(self, vector_store):
        """Test successful document addition."""
        # Arrange
        document_id = "doc1"
        content = "This is a test document about AI"
        metadata = {"source": "test", "category": "technology"}

        # Act
        await vector_store.add_document(document_id, content, metadata)

        # Assert
        vector_store.collection.add.assert_called_once()

    @pytest.mark.asyncio
    async def test_add_document_empty_content(self, vector_store):
        """Test document addition with empty content."""
        # Arrange
        document_id = "doc1"
        content = ""
        metadata = {"source": "test"}

        # Act & Assert
        with pytest.raises(VectorStoreError, match="Document content cannot be empty"):
            await vector_store.add_document(document_id, content, metadata)

    @pytest.mark.asyncio
    async def test_search_success(self, vector_store):
        """Test successful document search."""
        # Arrange
        query = "AI technology"
        mock_results = MagicMock()
        mock_results.ids = [["doc1", "doc2"]]
        mock_results.distances = [[0.1, 0.3]]
        mock_results.metadatas = [[{"source": "test1"}, {"source": "test2"}]]
        
        vector_store.collection.query.return_value = mock_results

        # Act
        results = await vector_store.search(query, top_k=2)

        # Assert
        assert len(results) == 2
        assert results[0]["id"] == "doc1"
        assert results[0]["similarity"] == 0.9  # 1 - distance
        assert results[1]["id"] == "doc2"
        assert results[1]["similarity"] == 0.7

    @pytest.mark.asyncio
    async def test_search_empty_query(self, vector_store):
        """Test search with empty query."""
        # Arrange
        query = ""

        # Act & Assert
        with pytest.raises(VectorStoreError, match="Search query cannot be empty"):
            await vector_store.search(query)

    @pytest.mark.asyncio
    async def test_search_no_results(self, vector_store):
        """Test search with no results."""
        # Arrange
        query = "nonexistent query"
        mock_results = MagicMock()
        mock_results.ids = [[]]
        mock_results.distances = [[]]
        mock_results.metadatas = [[]]
        
        vector_store.collection.query.return_value = mock_results

        # Act
        results = await vector_store.search(query)

        # Assert
        assert results == []

    @pytest.mark.asyncio
    async def test_delete_document_success(self, vector_store):
        """Test successful document deletion."""
        # Arrange
        document_id = "doc1"

        # Act
        await vector_store.delete_document(document_id)

        # Assert
        vector_store.collection.delete.assert_called_once_with(ids=[document_id])

    @pytest.mark.asyncio
    async def test_delete_document_empty_id(self, vector_store):
        """Test document deletion with empty ID."""
        # Arrange
        document_id = ""

        # Act & Assert
        with pytest.raises(VectorStoreError, match="Document ID cannot be empty"):
            await vector_store.delete_document(document_id)

    @pytest.mark.asyncio
    async def test_get_document_success(self, vector_store):
        """Test successful document retrieval."""
        # Arrange
        document_id = "doc1"
        mock_results = MagicMock()
        mock_results.ids = [["doc1"]]
        mock_results.documents = [["This is a test document"]]
        mock_results.metadatas = [[{"source": "test"}]]
        
        vector_store.collection.get.return_value = mock_results

        # Act
        document = await vector_store.get_document(document_id)

        # Assert
        assert document["id"] == "doc1"
        assert document["content"] == "This is a test document"
        assert document["metadata"]["source"] == "test"

    @pytest.mark.asyncio
    async def test_get_document_not_found(self, vector_store):
        """Test document retrieval for non-existent document."""
        # Arrange
        document_id = "nonexistent"
        mock_results = MagicMock()
        mock_results.ids = [[]]
        mock_results.documents = [[]]
        mock_results.metadatas = [[]]
        
        vector_store.collection.get.return_value = mock_results

        # Act & Assert
        with pytest.raises(VectorStoreError, match="Document not found"):
            await vector_store.get_document(document_id)

    @pytest.mark.asyncio
    async def test_update_document_success(self, vector_store):
        """Test successful document update."""
        # Arrange
        document_id = "doc1"
        content = "Updated content"
        metadata = {"source": "updated"}

        # Act
        await vector_store.update_document(document_id, content, metadata)

        # Assert
        # Should delete old document and add new one
        vector_store.collection.delete.assert_called_once_with(ids=[document_id])
        vector_store.collection.add.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_collection_stats(self, vector_store):
        """Test collection statistics retrieval."""
        # Arrange
        mock_collection = MagicMock()
        mock_collection.count.return_value = 100
        vector_store.collection = mock_collection

        # Act
        stats = await vector_store.get_collection_stats()

        # Assert
        assert stats["total_documents"] == 100
        assert "embedding_dimension" in stats
        assert "collection_name" in stats

    @pytest.mark.asyncio
    async def test_clear_collection_success(self, vector_store):
        """Test successful collection clearing."""
        # Act
        await vector_store.clear_collection()

        # Assert
        vector_store.collection.delete.assert_called_once()

    @pytest.mark.asyncio
    async def test_batch_add_documents_success(self, vector_store):
        """Test successful batch document addition."""
        # Arrange
        documents = [
            {"id": "doc1", "content": "Content 1", "metadata": {"source": "test1"}},
            {"id": "doc2", "content": "Content 2", "metadata": {"source": "test2"}}
        ]

        # Act
        await vector_store.batch_add_documents(documents)

        # Assert
        vector_store.collection.add.assert_called_once()

    @pytest.mark.asyncio
    async def test_batch_add_documents_empty_list(self, vector_store):
        """Test batch addition with empty list."""
        # Arrange
        documents = []

        # Act & Assert
        with pytest.raises(VectorStoreError, match="Documents list cannot be empty"):
            await vector_store.batch_add_documents(documents)

    @pytest.mark.asyncio
    async def test_validate_document_id(self, vector_store):
        """Test document ID validation."""
        # Valid cases
        assert vector_store._validate_document_id("valid_id") is None
        assert vector_store._validate_document_id("id_123") is None

        # Invalid cases
        with pytest.raises(VectorStoreError, match="Document ID cannot be empty"):
            vector_store._validate_document_id("")

        with pytest.raises(VectorStoreError, match="Document ID cannot be empty"):
            vector_store._validate_document_id(None)

    @pytest.mark.asyncio
    async def test_validate_content(self, vector_store):
        """Test content validation."""
        # Valid cases
        assert vector_store._validate_content("Valid content") is None
        assert vector_store._validate_content("A" * 1000) is None

        # Invalid cases
        with pytest.raises(VectorStoreError, match="Document content cannot be empty"):
            vector_store._validate_content("")

        with pytest.raises(VectorStoreError, match="Document content cannot be empty"):
            vector_store._validate_content(None)

    @pytest.mark.asyncio
    async def test_validate_query(self, vector_store):
        """Test query validation."""
        # Valid cases
        assert vector_store._validate_query("Valid query") is None
        assert vector_store._validate_query("A" * 1000) is None

        # Invalid cases
        with pytest.raises(VectorStoreError, match="Search query cannot be empty"):
            vector_store._validate_query("")

        with pytest.raises(VectorStoreError, match="Search query cannot be empty"):
            vector_store._validate_query(None)

    @pytest.mark.asyncio
    async def test_calculate_similarity(self, vector_store):
        """Test similarity calculation."""
        # Arrange
        distance = 0.3

        # Act
        similarity = vector_store._calculate_similarity(distance)

        # Assert
        assert similarity == 0.7  # 1 - distance
        assert 0 <= similarity <= 1

    @pytest.mark.asyncio
    async def test_format_search_results(self, vector_store):
        """Test search results formatting."""
        # Arrange
        ids = ["doc1", "doc2"]
        distances = [0.1, 0.3]
        metadatas = [{"source": "test1"}, {"source": "test2"}]

        # Act
        results = vector_store._format_search_results(ids, distances, metadatas)

        # Assert
        assert len(results) == 2
        assert results[0]["id"] == "doc1"
        assert results[0]["similarity"] == 0.9
        assert results[0]["metadata"]["source"] == "test1"
        assert results[1]["id"] == "doc2"
        assert results[1]["similarity"] == 0.7
        assert results[1]["metadata"]["source"] == "test2" 