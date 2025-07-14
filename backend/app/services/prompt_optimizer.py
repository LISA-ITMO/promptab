"""
Prompt optimization service
"""

from typing import List, Dict, Any, Optional, Tuple
import re
import json
from dataclasses import dataclass
from enum import Enum
from loguru import logger
import spacy
from jinja2 import Template

from app.core.config import settings
from app.core.exceptions import PromptOptimizationError
from app.services.llm_service import LLMService
from app.services.vector_store import VectorStore
from app.models.knowledge_base import KnowledgeBase


class OptimizationTechnique(str, Enum):
    """Prompt optimization techniques"""
    CHAIN_OF_THOUGHT = "chain_of_thought"
    ROLE_PLAYING = "role_playing" 
    FEW_SHOT = "few_shot"
    PROMPT_CHAINING = "prompt_chaining"
    STRUCTURED_OUTPUT = "structured_output"


@dataclass
class OptimizedPrompt:
    """Prompt optimization result"""
    original: str
    optimized: str
    techniques_used: List[str]
    rag_sources: List[Dict[str, Any]]
    structure: Dict[str, str]
    variables: List[Dict[str, str]]
    metadata: Dict[str, Any]


class PromptOptimizer:
    """Service for intelligent prompt optimization"""
    
    def __init__(self, llm_service: LLMService, vector_store: VectorStore):
        self.llm_service = llm_service
        self.vector_store = vector_store
        self.nlp = None
        self._initialize_nlp()
    
    def _initialize_nlp(self):
        """Initialize NLP models"""
        try:
            # Load spaCy models for text analysis
            self.nlp = {
                "ru": spacy.load("ru_core_news_sm"),
                "en": spacy.load("en_core_web_sm")
            }
        except Exception as e:
            logger.warning(f"Failed to load spaCy models: {str(e)}")
            self.nlp = {}
    
    async def optimize(
        self,
        prompt: str,
        techniques: Optional[List[str]] = None,
        use_rag: bool = True,
        llm_provider: Optional[str] = None,
        language: str = "auto"
    ) -> OptimizedPrompt:
        """
        Main method for prompt optimization
        
        Args:
            prompt: Original prompt
            techniques: List of techniques to apply (if None, selected automatically)
            use_rag: Use RAG for enrichment
            llm_provider: LLM provider for optimization
            language: Prompt language ("ru", "en", "auto")
            
        Returns:
            Optimized prompt with metadata
        """
        try:
            # Language detection
            if language == "auto":
                language = self._detect_language(prompt)
            
            # Prompt analysis
            analysis = await self._analyze_prompt(prompt, language)
            
            # Select optimization techniques
            if techniques is None:
                techniques = self._select_techniques(analysis)
            
            # RAG: search for relevant examples
            rag_sources = []
            if use_rag and settings.ENABLE_RAG:
                rag_results = await self.vector_store.search_similar(
                    prompt,
                    limit=3,
                    category=analysis.get("category")
                )
                rag_sources = self._format_rag_sources(rag_results)
            
            # Apply optimization techniques
            optimized_prompt = await self._apply_techniques(
                prompt=prompt,
                techniques=techniques,
                rag_sources=rag_sources,
                analysis=analysis,
                llm_provider=llm_provider
            )
            
            # Structure the prompt
            structured = self._structure_prompt(optimized_prompt, analysis)
            
            # Extract potential variables
            variables = self._extract_potential_variables(structured["full_prompt"])
            
            return OptimizedPrompt(
                original=prompt,
                optimized=structured["full_prompt"],
                techniques_used=techniques,
                rag_sources=rag_sources,
                structure=structured,
                variables=variables,
                metadata={
                    "language": language,
                    "analysis": analysis,
                    "provider": llm_provider or self.llm_service.get_default_provider()
                }
            )
            
        except Exception as e:
            logger.error(f"Prompt optimization failed: {str(e)}")
            raise PromptOptimizationError(f"Failed to optimize prompt: {str(e)}")
    
    def _detect_language(self, text: str) -> str:
        """Detect text language"""
        # Simple heuristic based on characters
        cyrillic_count = len(re.findall(r'[а-яА-Я]', text))
        latin_count = len(re.findall(r'[a-zA-Z]', text))
        
        if cyrillic_count > latin_count:
            return "ru"
        else:
            return "en"
    
    async def _analyze_prompt(self, prompt: str, language: str) -> Dict[str, Any]:
        """Analyze prompt to determine optimal techniques"""
        analysis = {
            "length": len(prompt),
            "sentences": len(prompt.split('.')),
            "questions": len(re.findall(r'\?', prompt)),
            "has_instructions": bool(re.search(r'(please|пожалуйста|должен|should|must)', prompt, re.I)),
            "has_context": len(prompt) > 100,
            "complexity": "simple" if len(prompt) < 50 else "medium" if len(prompt) < 200 else "complex",
            "intent": self._detect_intent(prompt),
            "category": self._detect_category(prompt),
            "entities": []
        }
        
        # NLP analysis if available
        if self.nlp and language in self.nlp:
            doc = self.nlp[language](prompt)
            analysis["entities"] = [(ent.text, ent.label_) for ent in doc.ents]
        
        return analysis
    
    def _detect_intent(self, prompt: str) -> str:
        """Detect user intent"""
        prompt_lower = prompt.lower()
        
        if any(word in prompt_lower for word in ["объясни", "explain", "что такое", "what is"]):
            return "explanation"
        elif any(word in prompt_lower for word in ["создай", "create", "generate", "напиши", "write"]):
            return "generation"
        elif any(word in prompt_lower for word in ["анализ", "analyze", "оцени", "evaluate"]):
            return "analysis"
        elif any(word in prompt_lower for word in ["переведи", "translate", "перевод"]):
            return "translation"
        elif any(word in prompt_lower for word in ["код", "code", "программа", "function"]):
            return "coding"
        else:
            return "general"
    
    def _detect_category(self, prompt: str) -> Optional[str]:
        """Detect prompt category"""
        categories = {
            "marketing": ["маркетинг", "продвижение", "реклама", "marketing", "promotion", "advertising"],
            "coding": ["код", "программа", "функция", "code", "program", "function", "debug"],
            "writing": ["статья", "текст", "пост", "article", "text", "post", "blog"],
            "education": ["обучение", "урок", "объяснение", "learning", "lesson", "explain"],
            "business": ["бизнес", "стратегия", "план", "business", "strategy", "plan"],
        }
        
        prompt_lower = prompt.lower()
        for category, keywords in categories.items():
            if any(keyword in prompt_lower for keyword in keywords):
                return category
        
        return None
    
    def _select_techniques(self, analysis: Dict[str, Any]) -> List[str]:
        """Select appropriate optimization techniques based on analysis"""
        techniques = []
        
        # Role-playing for creative tasks
        if analysis["intent"] in ["generation", "writing"]:
            techniques.append(OptimizationTechnique.ROLE_PLAYING)
        
        # Chain-of-thought for complex tasks
        if analysis["complexity"] == "complex" or analysis["intent"] in ["analysis", "coding"]:
            techniques.append(OptimizationTechnique.CHAIN_OF_THOUGHT)
        
        # Few-shot if there's context
        if analysis["has_context"]:
            techniques.append(OptimizationTechnique.FEW_SHOT)
        
        # Structured output for generation
        if analysis["intent"] == "generation":
            techniques.append(OptimizationTechnique.STRUCTURED_OUTPUT)
        
        # If no techniques selected, use basic ones
        if not techniques:
            techniques = [OptimizationTechnique.ROLE_PLAYING, OptimizationTechnique.STRUCTURED_OUTPUT]
        
        return techniques
    
    def _format_rag_sources(self, rag_results: List[Tuple[KnowledgeBase, float]]) -> List[Dict[str, Any]]:
        """Format RAG results"""
        sources = []
        for kb_item, similarity in rag_results:
            sources.append({
                "id": str(kb_item.id),
                "title": kb_item.title,
                "content": kb_item.content,
                "category": kb_item.category,
                "similarity": round(similarity, 3)
            })
        return sources
    
    async def _apply_techniques(
        self,
        prompt: str,
        techniques: List[str],
        rag_sources: List[Dict[str, Any]],
        analysis: Dict[str, Any],
        llm_provider: Optional[str] = None
    ) -> str:
        """Apply optimization techniques to the prompt"""
        
        # Create prompt for LLM with optimization instructions
        optimization_prompt = self._create_optimization_prompt(
            prompt, techniques, rag_sources, analysis
        )
        
        # Query LLM for optimization
        result = await self.llm_service.generate(
            prompt=optimization_prompt,
            provider=llm_provider or self.llm_service.get_default_provider(),
            system_prompt=settings.SYSTEM_PROMPT_OPTIMIZER,
            temperature=0.7,
            max_tokens=2000
        )
        
        return result["response"]
    
    def _create_optimization_prompt(
        self,
        original_prompt: str,
        techniques: List[str],
        rag_sources: List[Dict[str, Any]],
        analysis: Dict[str, Any]
    ) -> str:
        """Create prompt for LLM with optimization instructions"""
        
        template = """
Optimize the following prompt using these techniques: {{ techniques }}

Original prompt: "{{ original_prompt }}"

Analysis:
- Intent: {{ analysis.intent }}
- Complexity: {{ analysis.complexity }}
- Category: {{ analysis.category or "general" }}

{% if rag_sources %}
Relevant examples from knowledge base:
{% for source in rag_sources %}
{{ loop.index }}. {{ source.title }}
   {{ source.content }}
   (Similarity: {{ source.similarity }})
{% endfor %}
{% endif %}

Apply the following optimizations:
{% for technique in techniques %}
- {{ technique }}: 
  {% if technique == "chain_of_thought" %}
  Add step-by-step reasoning instructions
  {% elif technique == "role_playing" %}
  Assign an appropriate expert role
  {% elif technique == "few_shot" %}
  Include relevant examples from the knowledge base
  {% elif technique == "structured_output" %}
  Define clear output format and structure
  {% elif technique == "prompt_chaining" %}
  Break down into sub-tasks if needed
  {% endif %}
{% endfor %}

Return ONLY the optimized prompt without any explanations or meta-commentary.
The optimized prompt should be immediately usable with an LLM.
"""
        
        jinja_template = Template(template)
        return jinja_template.render(
            original_prompt=original_prompt,
            techniques=techniques,
            rag_sources=rag_sources[:3],  # Maximum 3 examples
            analysis=analysis
        )
    
    def _structure_prompt(self, optimized_prompt: str, analysis: Dict[str, Any]) -> Dict[str, str]:
        """Structure the optimized prompt"""
        
        # Attempt to extract structured parts from LLM response
        structure = {
            "role": "",
            "task": "",
            "context": "",
            "instructions": "",
            "constraints": "",
            "tone": "",
            "full_prompt": optimized_prompt
        }
        
        # Heuristics for extracting parts
        role_match = re.search(r'(You are|Ты|Вы являетесь|Act as)(.*?)(?:\.|$)', optimized_prompt, re.I | re.S)
        if role_match:
            structure["role"] = role_match.group(0).strip()
        
        task_match = re.search(r'(Your task is|Твоя задача|Ваша задача)(.*?)(?:\.|$)', optimized_prompt, re.I | re.S)
        if task_match:
            structure["task"] = task_match.group(0).strip()
        
        # Determine tone based on analysis
        if analysis["intent"] == "generation":
            structure["tone"] = "creative and engaging"
        elif analysis["intent"] == "explanation":
            structure["tone"] = "clear and educational"
        elif analysis["intent"] == "analysis":
            structure["tone"] = "analytical and objective"
        else:
            structure["tone"] = "professional and helpful"
        
        return structure
    
    def _extract_potential_variables(self, prompt: str) -> List[Dict[str, str]]:
        """Extract potential variables from the prompt"""
        variables = []
        
        # Search for phrases in quotes
        quoted_patterns = re.findall(r'"([^"]+)"|«([^»]+)»|"([^"]+)"', prompt)
        for matches in quoted_patterns:
            text = next(m for m in matches if m)
            if 5 < len(text) < 100:  # Reasonable length limits
                variables.append({
                    "text": text,
                    "suggested_name": self._suggest_variable_name(text),
                    "type": "quoted"
                })
        
        # Search for named entities
        if self.nlp:
            # Simple search for capitalized words as fallback
            capitalized = re.findall(r'\b[A-ZА-Я][a-zа-я]+(?:\s+[A-ZА-Я][a-zа-я]+)*\b', prompt)
            for entity in capitalized[:5]:  # Maximum 5 entities
                if entity not in [v["text"] for v in variables]:
                    variables.append({
                        "text": entity,
                        "suggested_name": self._suggest_variable_name(entity),
                        "type": "entity"
                    })
        
        # Search for numbers and dates
        numbers = re.findall(r'\b\d+(?:\.\d+)?(?:\s*(?:%|процент|percent))?\b', prompt)
        for number in numbers[:3]:  # Maximum 3 numbers
            variables.append({
                "text": number,
                "suggested_name": "value",
                "type": "number"
            })
        
        return variables[:settings.MAX_VARIABLES_PER_TEMPLATE]
    
    def _suggest_variable_name(self, text: str) -> str:
        """Suggest a name for a variable"""
        # Remove special characters and spaces
        name = re.sub(r'[^\w\s]', '', text)
        name = re.sub(r'\s+', '_', name)
        
        # Limit length
        if len(name) > 30:
            words = name.split('_')
            if words:
                name = words[0]
            else:
                name = name[:30]
        
        # Convert to lowercase for English words
        if re.match(r'^[a-zA-Z_]+$', name):
            name = name.lower()
        
        return name or "variable"

