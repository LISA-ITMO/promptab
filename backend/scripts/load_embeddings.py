"""
Script to load prompts from Hugging Face dataset into vector database
"""


import asyncio
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from datasets import load_dataset
from loguru import logger
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.knowledge_base import KnowledgeBase
from app.services.vector_store import VectorStore


async def load_awesome_prompts():
    """Load awesome-chatgpt-prompts dataset into vector database"""
    logger.info("Starting to load awesome-chatgpt-prompts dataset...")
    
    vector_store = None
    try:
        # Load dataset
        dataset = load_dataset("fka/awesome-chatgpt-prompts", split="train")
        logger.info(f"Loaded {len(dataset)} prompts from dataset")
        
        # Инициализация векторного хранилища
        vector_store = VectorStore()
        await vector_store.initialize()
        
        async with AsyncSessionLocal() as db:
            # Check if data is already loaded
            stmt = select(KnowledgeBase).limit(1)
            result = await db.execute(stmt)
            existing = result.scalar_one_or_none()
            
            if existing:
                logger.warning("Knowledge base already contains data. Skipping load.")
                return
            
            # Load prompts in batches
            batch_size = 10
            total_loaded = 0
            
            for i in range(0, len(dataset), batch_size):
                batch = dataset[i:i + batch_size]
                
                for item in batch:
                    try:
                        # Extract data
                        act = item.get("act", "")
                        prompt = item.get("prompt", "")
                        
                        if not act or not prompt:
                            continue
                        
                        # Determine category based on content
                        category = detect_category(act, prompt)
                        
                        # Add to knowledge base
                        await vector_store.add_to_knowledge_base(
                            title=act,
                            content=prompt,
                            category=category,
                            metadata={
                                "source": "awesome-chatgpt-prompts",
                                "original_index": i
                            },
                            db=db
                        )
                        
                        total_loaded += 1
                        
                    except Exception as e:
                        logger.error(f"Error loading prompt '{act}': {str(e)}")
                        continue
                
                logger.info(f"Loaded {total_loaded}/{len(dataset)} prompts...")
            
            await db.commit()
            logger.info(f"Successfully loaded {total_loaded} prompts into knowledge base")
            
    except Exception as e:
        logger.error(f"Failed to load dataset: {str(e)}")
        raise
    finally:
        if vector_store:
            await vector_store.close()


def detect_category(title: str, content: str) -> str:
    """Simple prompt category detection"""
    combined = (title + " " + content).lower()
    
    if any(word in combined for word in ["code", "program", "debug", "function", "developer"]):
        return "coding"
    elif any(word in combined for word in ["write", "writing", "essay", "article", "blog"]):
        return "writing"
    elif any(word in combined for word in ["market", "business", "strategy", "sales"]):
        return "business"
    elif any(word in combined for word in ["teach", "education", "learn", "explain"]):
        return "education"
    elif any(word in combined for word in ["translate", "language"]):
        return "translation"
    elif any(word in combined for word in ["creative", "story", "fiction"]):
        return "creative"
    else:
        return "general"


if __name__ == "__main__":
    asyncio.run(load_awesome_prompts()) 