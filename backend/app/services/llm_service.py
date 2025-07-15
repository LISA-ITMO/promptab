"""
Service for working with various LLM providers
"""

from typing import List, Dict, Any, Optional, Union
from abc import ABC, abstractmethod
import httpx
import openai
import ollama
from loguru import logger
import asyncio
import time

from app.core.config import settings
from app.core.exceptions import LLMError


class LLMProvider(ABC):
    """Base class for LLM providers"""
    
    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> str:
        """Generate response from LLM"""
        pass
    
    @abstractmethod
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ):
        """Stream response from LLM"""
        pass


class OpenAIProvider(LLMProvider):
    """OpenAI provider"""
    
    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        self.client = openai.AsyncOpenAI(api_key=api_key)
        self.model = model
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> str:
        """Generate response from OpenAI"""
        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"OpenAI generation error: {str(e)}")
            raise LLMError(f"OpenAI generation failed: {str(e)}")
    
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ):
        """Stream response from OpenAI"""
        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
                **kwargs
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            logger.error(f"OpenAI stream error: {str(e)}")
            raise LLMError(f"OpenAI stream failed: {str(e)}")


class DeepSeekProvider(LLMProvider):
    """DeepSeek provider"""
    
    def __init__(self, api_key: str, model: str = "deepseek-chat"):
        self.api_key = api_key
        self.model = model
        self.base_url = "https://api.deepseek.com/v1"
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> str:
        """Generate response from DeepSeek"""
        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": messages,
                        "temperature": temperature,
                        "max_tokens": max_tokens,
                        **kwargs
                    },
                    timeout=60.0
                )
                response.raise_for_status()
                
            data = response.json()
            return data["choices"][0]["message"]["content"]
            
        except Exception as e:
            logger.error(f"DeepSeek generation error: {str(e)}")
            raise LLMError(f"DeepSeek generation failed: {str(e)}")
    
    async def generate_stream(self, *args, **kwargs):
        """DeepSeek doesn't support streaming via API yet"""
        raise NotImplementedError("DeepSeek streaming not implemented")


class PerplexityProvider(LLMProvider):
    """Perplexity provider"""
    
    def __init__(self, api_key: str, model: str = "sonar"):
        self.api_key = api_key
        self.model = model
        self.base_url = "https://api.perplexity.ai"
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> str:
        """Generate response from Perplexity"""
        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": messages,
                        "temperature": temperature,
                        "max_tokens": max_tokens,
                        **kwargs
                    },
                    timeout=60.0
                )
                response.raise_for_status()
                
            data = response.json()
            return data["choices"][0]["message"]["content"]
            
        except Exception as e:
            logger.error(f"Perplexity generation error: {str(e)}")
            raise LLMError(f"Perplexity generation failed: {str(e)}")
    
    async def generate_stream(self, *args, **kwargs):
        """Perplexity streaming requires separate implementation"""
        raise NotImplementedError("Perplexity streaming not implemented")


class OllamaProvider(LLMProvider):
    """Ollama provider for local models"""
    
    def __init__(self, base_url: str = "http://ollama:11434", model: str = "llama3.1"):
        self.base_url = base_url
        self.model = model
        self.client = ollama.AsyncClient(host=base_url)
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> str:
        """Generate response from Ollama"""
        try:
            full_prompt = ""
            if system_prompt:
                full_prompt = f"{system_prompt}\n\n{prompt}"
            else:
                full_prompt = prompt
            
            response = await self.client.generate(
                model=self.model,
                prompt=full_prompt,
                options={
                    "temperature": temperature,
                    "num_predict": max_tokens,
                    **kwargs
                }
            )
            
            return response["response"]
            
        except Exception as e:
            logger.error(f"Ollama generation error: {str(e)}")
            raise LLMError(f"Ollama generation failed: {str(e)}")
    
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ):
        """Stream response from Ollama"""
        try:
            full_prompt = ""
            if system_prompt:
                full_prompt = f"{system_prompt}\n\n{prompt}"
            else:
                full_prompt = prompt
            
            stream = await self.client.generate(
                model=self.model,
                prompt=full_prompt,
                options={
                    "temperature": temperature,
                    "num_predict": max_tokens,
                    **kwargs
                },
                stream=True
            )
            
            async for chunk in stream:
                if chunk.get("response"):
                    yield chunk["response"]
                    
        except Exception as e:
            logger.error(f"Ollama stream error: {str(e)}")
            raise LLMError(f"Ollama stream failed: {str(e)}")


class LLMService:
    """Service for working with LLM"""
    
    def __init__(self):
        self.providers: Dict[str, LLMProvider] = {}
        self._initialize_providers()
    
    def _initialize_providers(self):
        """Initialize available providers"""
        # OpenAI
        if settings.OPENAI_API_KEY:
            self.providers["openai"] = OpenAIProvider(
                api_key=settings.OPENAI_API_KEY,
                model=settings.OPENAI_MODEL
            )
            logger.info("OpenAI provider initialized")
        
        # DeepSeek
        if settings.DEEPSEEK_API_KEY:
            self.providers["deepseek"] = DeepSeekProvider(
                api_key=settings.DEEPSEEK_API_KEY
            )
            logger.info("DeepSeek provider initialized")
        
        # Perplexity
        if settings.PERPLEXITY_API_KEY:
            self.providers["perplexity"] = PerplexityProvider(
                api_key=settings.PERPLEXITY_API_KEY
            )
            logger.info("Perplexity provider initialized")
        
        # Ollama (always available for local models)
        self.providers["ollama"] = OllamaProvider(
            base_url=settings.OLLAMA_BASE_URL,
            model=settings.OLLAMA_MODEL
        )
        logger.info("Ollama provider initialized")
    
    async def generate(
        self,
        prompt: str,
        provider: str = "openai",
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        measure_time: bool = True,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate response from selected LLM provider
        
        Args:
            prompt: Prompt for generation
            provider: Provider name
            system_prompt: System prompt
            temperature: Generation temperature
            max_tokens: Maximum number of tokens
            measure_time: Measure generation time
            **kwargs: Additional parameters for the provider
            
        Returns:
            Dictionary with response and metadata
        """
        if provider not in self.providers:
            raise LLMError(f"Provider '{provider}' not available")
        
        start_time = time.time() if measure_time else None
        
        try:
            llm_provider = self.providers[provider]
            response = await llm_provider.generate(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )
            
            result = {
                "response": response,
                "provider": provider,
                "model": getattr(llm_provider, "model", "unknown"),
            }
            
            if measure_time:
                result["response_time_ms"] = int((time.time() - start_time) * 1000)
            
            return result
            
        except Exception as e:
            logger.error(f"LLM generation error with {provider}: {str(e)}")
            raise
    
    async def generate_stream(
        self,
        prompt: str,
        provider: str = "openai",
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ):
        """Stream response from selected LLM provider"""
        if provider not in self.providers:
            raise LLMError(f"Provider '{provider}' not available")
        
        try:
            llm_provider = self.providers[provider]
            async for chunk in llm_provider.generate_stream(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            ):
                yield chunk
                
        except Exception as e:
            logger.error(f"LLM stream error with {provider}: {str(e)}")
            raise
    
    def get_available_providers(self) -> List[str]:
        """Get list of available providers"""
        return list(self.providers.keys())
    
    def get_default_provider(self) -> str:
        """Get default provider"""
        if "perplexity" in self.providers:
            return "perplexity"
        elif "deepseek" in self.providers:
            return "deepseek"
        elif "ollama" in self.providers:
            return "ollama"
        elif "openai" in self.providers:
            return "openai"
        else:
            return "ollama"
