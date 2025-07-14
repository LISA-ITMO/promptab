"""
Unit tests for PromptOptimizer service
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.prompt_optimizer import PromptOptimizer
from app.core.exceptions import PromptOptimizationError


class TestPromptOptimizer:
    """Test cases for PromptOptimizer service."""

    @pytest.fixture
    def optimizer(self):
        """Create PromptOptimizer instance with mocked dependencies."""
        with patch('app.services.prompt_optimizer.LLMService') as mock_llm, \
             patch('app.services.prompt_optimizer.VectorStore') as mock_vector:
            
            mock_llm_instance = MagicMock()
            mock_llm_instance.generate_response = AsyncMock()
            mock_llm_instance.analyze_prompt = AsyncMock()
            mock_llm.return_value = mock_llm_instance
            
            mock_vector_instance = MagicMock()
            mock_vector_instance.search = AsyncMock()
            mock_vector_instance.add_document = AsyncMock()
            mock_vector.return_value = mock_vector_instance
            
            return PromptOptimizer()

    @pytest.mark.asyncio
    async def test_optimize_basic_prompt(self, optimizer):
        """Test basic prompt optimization."""
        # Arrange
        prompt = "Write a blog post about AI"
        optimizer.llm_service.generate_response.return_value = "Optimized blog post prompt"
        optimizer.llm_service.analyze_prompt.return_value = {
            "intent": "generation",
            "category": "writing",
            "complexity": "medium"
        }
        optimizer.vector_store.search.return_value = []

        # Act
        result = await optimizer.optimize(prompt)

        # Assert
        assert result["original"] == prompt
        assert result["optimized"] == "Optimized blog post prompt"
        assert "rag" in result["techniques_used"]
        assert "chain_of_thought" in result["techniques_used"]
        assert isinstance(result["structure"], dict)
        assert isinstance(result["variables"], list)

    @pytest.mark.asyncio
    async def test_optimize_with_rag_sources(self, optimizer):
        """Test prompt optimization with RAG sources."""
        # Arrange
        prompt = "Explain machine learning"
        rag_sources = [
            {"id": "1", "content": "ML is a subset of AI", "similarity": 0.9},
            {"id": "2", "content": "ML uses algorithms", "similarity": 0.8}
        ]
        
        optimizer.llm_service.generate_response.return_value = "Enhanced ML explanation"
        optimizer.llm_service.analyze_prompt.return_value = {
            "intent": "explanation",
            "category": "education",
            "complexity": "high"
        }
        optimizer.vector_store.search.return_value = rag_sources

        # Act
        result = await optimizer.optimize(prompt)

        # Assert
        assert result["rag_sources"] == rag_sources
        assert "rag" in result["techniques_used"]
        assert len(result["rag_sources"]) == 2

    @pytest.mark.asyncio
    async def test_optimize_with_variables(self, optimizer):
        """Test prompt optimization with variable extraction."""
        # Arrange
        prompt = "Write a {{topic}} about {{subject}} for {{audience}}"
        optimizer.llm_service.generate_response.return_value = "Enhanced prompt with variables"
        optimizer.llm_service.analyze_prompt.return_value = {
            "intent": "generation",
            "category": "writing",
            "complexity": "medium"
        }
        optimizer.vector_store.search.return_value = []

        # Act
        result = await optimizer.optimize(prompt)

        # Assert
        assert len(result["variables"]) >= 3
        variable_names = [v["name"] for v in result["variables"]]
        assert "topic" in variable_names
        assert "subject" in variable_names
        assert "audience" in variable_names

    @pytest.mark.asyncio
    async def test_optimize_empty_prompt(self, optimizer):
        """Test optimization with empty prompt."""
        # Arrange
        prompt = ""

        # Act & Assert
        with pytest.raises(PromptOptimizationError, match="Prompt cannot be empty"):
            await optimizer.optimize(prompt)

    @pytest.mark.asyncio
    async def test_optimize_very_long_prompt(self, optimizer):
        """Test optimization with very long prompt."""
        # Arrange
        prompt = "A" * 10000  # Very long prompt

        # Act & Assert
        with pytest.raises(PromptOptimizationError, match="Prompt too long"):
            await optimizer.optimize(prompt)

    @pytest.mark.asyncio
    async def test_optimize_llm_service_error(self, optimizer):
        """Test optimization when LLM service fails."""
        # Arrange
        prompt = "Test prompt"
        optimizer.llm_service.generate_response.side_effect = Exception("LLM service error")

        # Act & Assert
        with pytest.raises(PromptOptimizationError, match="Failed to optimize prompt"):
            await optimizer.optimize(prompt)

    @pytest.mark.asyncio
    async def test_optimize_vector_store_error(self, optimizer):
        """Test optimization when vector store fails."""
        # Arrange
        prompt = "Test prompt"
        optimizer.vector_store.search.side_effect = Exception("Vector store error")
        optimizer.llm_service.generate_response.return_value = "Optimized prompt"
        optimizer.llm_service.analyze_prompt.return_value = {
            "intent": "general",
            "category": "general",
            "complexity": "medium"
        }

        # Act
        result = await optimizer.optimize(prompt)

        # Assert - should still work without RAG
        assert result["original"] == prompt
        assert result["optimized"] == "Optimized prompt"
        assert "rag" not in result["techniques_used"]

    @pytest.mark.asyncio
    async def test_detect_intent(self, optimizer):
        """Test intent detection."""
        # Test cases
        test_cases = [
            ("Объясни что такое AI", "explanation"),
            ("Создай код на Python", "generation"),
            ("Проанализируй данные", "analysis"),
            ("Переведи текст", "translation"),
            ("Напиши функцию", "coding"),
            ("Обычный запрос", "general"),
        ]

        for prompt, expected_intent in test_cases:
            intent = optimizer._detect_intent(prompt)
            assert intent == expected_intent

    @pytest.mark.asyncio
    async def test_detect_category(self, optimizer):
        """Test category detection."""
        # Test cases
        test_cases = [
            ("Маркетинговая кампания", "marketing"),
            ("Напиши код", "coding"),
            ("Статья для блога", "writing"),
            ("Обучающий материал", "education"),
            ("Бизнес план", "business"),
            ("Обычный запрос", None),
        ]

        for prompt, expected_category in test_cases:
            category = optimizer._detect_category(prompt)
            assert category == expected_category

    @pytest.mark.asyncio
    async def test_extract_variables(self, optimizer):
        """Test variable extraction from prompt."""
        # Arrange
        prompt = "Write a {{topic}} about {{subject}} for {{audience}} with {{style}}"

        # Act
        variables = optimizer._extract_variables(prompt)

        # Assert
        assert len(variables) == 4
        variable_names = [v["name"] for v in variables]
        assert "topic" in variable_names
        assert "subject" in variable_names
        assert "audience" in variable_names
        assert "style" in variable_names

        # Check variable structure
        for variable in variables:
            assert "name" in variable
            assert "description" in variable
            assert "type" in variable
            assert "required" in variable

    @pytest.mark.asyncio
    async def test_extract_variables_no_variables(self, optimizer):
        """Test variable extraction from prompt without variables."""
        # Arrange
        prompt = "Write a blog post about AI"

        # Act
        variables = optimizer._extract_variables(prompt)

        # Assert
        assert variables == []

    @pytest.mark.asyncio
    async def test_build_optimization_prompt(self, optimizer):
        """Test building optimization prompt."""
        # Arrange
        original_prompt = "Write a blog post"
        rag_sources = [{"content": "Blog writing tips", "similarity": 0.8}]
        intent = "generation"
        category = "writing"

        # Act
        optimization_prompt = optimizer._build_optimization_prompt(
            original_prompt, rag_sources, intent, category
        )

        # Assert
        assert original_prompt in optimization_prompt
        assert "Blog writing tips" in optimization_prompt
        assert "generation" in optimization_prompt
        assert "writing" in optimization_prompt

    @pytest.mark.asyncio
    async def test_apply_optimization_techniques(self, optimizer):
        """Test applying optimization techniques."""
        # Arrange
        prompt = "Write a blog post"
        intent = "generation"
        category = "writing"
        rag_sources = [{"content": "Tips", "similarity": 0.8}]

        # Act
        techniques = optimizer._apply_optimization_techniques(
            prompt, intent, category, rag_sources
        )

        # Assert
        assert isinstance(techniques, list)
        assert "rag" in techniques
        assert "chain_of_thought" in techniques

    @pytest.mark.asyncio
    async def test_apply_optimization_techniques_no_rag(self, optimizer):
        """Test applying optimization techniques without RAG."""
        # Arrange
        prompt = "Write a blog post"
        intent = "generation"
        category = "writing"
        rag_sources = []

        # Act
        techniques = optimizer._apply_optimization_techniques(
            prompt, intent, category, rag_sources
        )

        # Assert
        assert "rag" not in techniques
        assert "chain_of_thought" in techniques

    @pytest.mark.asyncio
    async def test_validate_prompt(self, optimizer):
        """Test prompt validation."""
        # Valid cases
        assert optimizer._validate_prompt("Valid prompt") is None
        assert optimizer._validate_prompt("A" * 1000) is None

        # Invalid cases
        with pytest.raises(PromptOptimizationError, match="Prompt cannot be empty"):
            optimizer._validate_prompt("")

        with pytest.raises(PromptOptimizationError, match="Prompt too long"):
            optimizer._validate_prompt("A" * 10000)

    @pytest.mark.asyncio
    async def test_build_prompt_structure(self, optimizer):
        """Test building prompt structure."""
        # Arrange
        optimized_prompt = "Enhanced blog post prompt"
        intent = "generation"
        category = "writing"

        # Act
        structure = optimizer._build_prompt_structure(optimized_prompt, intent, category)

        # Assert
        assert structure["role"] == "assistant"
        assert structure["task"] == "help"
        assert structure["instructions"] == optimized_prompt
        assert structure["tone"] == "professional"
        assert "context" in structure
        assert "constraints" in structure 