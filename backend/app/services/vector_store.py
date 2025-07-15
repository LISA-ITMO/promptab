"""
Vector store service for RAG
"""

from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from sentence_transformers import SentenceTransformer
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger
import asyncio
from concurrent.futures import ThreadPoolExecutor

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.exceptions import VectorStoreError
from app.models.knowledge_base import KnowledgeBase


class VectorStore:
    """Service for working with vector store"""
    
    def __init__(self):
        self.model = None
        self.executor = ThreadPoolExecutor(max_workers=4)
        self._initialized = False
    
    async def initialize(self):
        """Initialize vector store"""
        try:
            logger.info(f"Initializing vector store with model: {settings.VECTOR_EMBEDDING_MODEL}")
            
            # Load model for creating embeddings
            loop = asyncio.get_event_loop()
            self.model = await loop.run_in_executor(
                self.executor,
                SentenceTransformer,
                settings.VECTOR_EMBEDDING_MODEL
            )
            
            self._initialized = True
            logger.info("Vector store initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize vector store: {str(e)}")
            raise VectorStoreError(f"Failed to initialize vector store: {str(e)}")
    
    async def close(self):
        """Close resources"""
        self.executor.shutdown(wait=True)
    
    async def create_embedding(self, text: str) -> np.ndarray:
        """
        Create vector representation of text
        
        Args:
            text: Text to vectorize
            
        Returns:
            Vector representation
        """
        if not self._initialized:
            raise VectorStoreError("Vector store not initialized")
        
        try:
            loop = asyncio.get_event_loop()
            embedding = await loop.run_in_executor(
                self.executor,
                self.model.encode,
                text
            )
            return embedding
        except Exception as e:
            logger.error(f"Failed to create embedding: {str(e)}")
            raise VectorStoreError(f"Failed to create embedding: {str(e)}")
    
    async def create_embeddings_batch(self, texts: List[str]) -> List[np.ndarray]:
        """
        Create vector representations for a list of texts
        
        Args:
            texts: List of texts
            
        Returns:
            List of vector representations
        """
        if not self._initialized:
            raise VectorStoreError("Vector store not initialized")
        
        try:
            loop = asyncio.get_event_loop()
            embeddings = await loop.run_in_executor(
                self.executor,
                self.model.encode,
                texts
            )
            return embeddings
        except Exception as e:
            logger.error(f"Failed to create embeddings batch: {str(e)}")
            raise VectorStoreError(f"Failed to create embeddings batch: {str(e)}")
    
    async def search_similar(
        self,
        query_text: str,
        limit: int = None,
        threshold: float = None,
        category: Optional[str] = None,
        db: Optional[AsyncSession] = None
    ) -> List[Tuple[KnowledgeBase, float]]:
        """
        Search for similar prompts in knowledge base
        
        Args:
            query_text: Query text
            limit: Maximum number of results
            threshold: Minimum similarity threshold
            category: Category filter
            db: Database session (if not provided, creates new one)
            
        Returns:
            List of tuples (prompt, similarity)
        """
        if not self._initialized:
            raise VectorStoreError("Vector store not initialized")
        
        limit = limit or settings.MAX_SEARCH_RESULTS
        threshold = threshold or settings.SIMILARITY_THRESHOLD
        
        # Create embedding for query
        query_embedding = await self.create_embedding(query_text)
        
        # Manage database session
        if db is None:
            async with AsyncSessionLocal() as session:
                return await self._perform_search(
                    session, query_embedding, limit, threshold, category
                )
        else:
            return await self._perform_search(
                db, query_embedding, limit, threshold, category
            )
    
    async def _perform_search(
        self,
        db: AsyncSession,
        query_embedding: np.ndarray,
        limit: int,
        threshold: float,
        category: Optional[str]
    ) -> List[Tuple[KnowledgeBase, float]]:
        """Perform vector search in database"""
        try:
            # Form SQL query using pgvector
            # Form SQL query depending on category presence
            if category is not None:
                sql = text("""
                    SELECT 
                        id,
                        title,
                        content,
                        category,
                        meta_data,
                        created_at,
                        updated_at,
                        1 - (embedding <=> :embedding) as similarity
                    FROM promptab.knowledge_base
                    WHERE 1 - (embedding <=> :embedding) > :threshold
                        AND category = :category
                    ORDER BY embedding <=> :embedding
                    LIMIT :limit
                """)
                params = {
                    "embedding": str(query_embedding.tolist()),
                    "threshold": threshold,
                    "category": category,
                    "limit": limit
                }
            else:
                sql = text("""
                    SELECT 
                        id,
                        title,
                        content,
                        category,
                        meta_data,
                        created_at,
                        updated_at,
                        1 - (embedding <=> :embedding) as similarity
                    FROM promptab.knowledge_base
                    WHERE 1 - (embedding <=> :embedding) > :threshold
                    ORDER BY embedding <=> :embedding
                    LIMIT :limit
                """)
                params = {
                    "embedding": str(query_embedding.tolist()),
                    "threshold": threshold,
                    "limit": limit
                }
            
            # Execute query
            result = await db.execute(sql, params)
            
            # Transform results
            items = []
            for row in result:
                kb_item = KnowledgeBase(
                    id=row.id,
                    title=row.title,
                    content=row.content,
                    category=row.category,
                    meta_data=row.meta_data,
                    created_at=row.created_at,
                    updated_at=row.updated_at
                )
                similarity = row.similarity
                items.append((kb_item, similarity))
            
            logger.info(f"Found {len(items)} similar items for query")
            return items
            
        except Exception as e:
            logger.error(f"Vector search failed: {str(e)}")
            raise VectorStoreError(f"Vector search failed: {str(e)}")
    
    async def add_to_knowledge_base(
        self,
        title: str,
        content: str,
        category: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        db: Optional[AsyncSession] = None
    ) -> KnowledgeBase:
        """
        Add new item to knowledge base
        
        Args:
            title: Title
            content: Content
            category: Category
            metadata: Metadata
            db: Database session
            
        Returns:
            Created knowledge base item
        """
        if not self._initialized:
            raise VectorStoreError("Vector store not initialized")
        
        # Create embedding
        embedding = await self.create_embedding(f"{title}\n{content}")
        
        # Create record in DB
        kb_item = KnowledgeBase(
            title=title,
            content=content,
            category=category,
            embedding=embedding.tolist(),
            meta_data=metadata or {}
        )
        
        if db is None:
            async with AsyncSessionLocal() as session:
                session.add(kb_item)
                await session.commit()
                await session.refresh(kb_item)
        else:
            db.add(kb_item)
            await db.commit()
            await db.refresh(kb_item)
        
        logger.info(f"Added new item to knowledge base: {kb_item.id}")
        return kb_item
    
    async def update_embeddings(self, db: Optional[AsyncSession] = None):
        """Update embeddings for all knowledge base items (used when embedding model changes)"""
        if not self._initialized:
            raise VectorStoreError("Vector store not initialized")
        
        async def _update_batch(session: AsyncSession):
            # Get all items without embeddings or for update
            stmt = select(KnowledgeBase)
            result = await session.execute(stmt)
            items = result.scalars().all()
            
            logger.info(f"Updating embeddings for {len(items)} items")
            
            # Update embeddings in batches
            batch_size = 32
            for i in range(0, len(items), batch_size):
                batch = items[i:i + batch_size]
                texts = [f"{item.title}\n{item.content}" for item in batch]
                
                embeddings = await self.create_embeddings_batch(texts)
                
                for item, embedding in zip(batch, embeddings):
                    item.embedding = embedding.tolist()
                
                await session.commit()
                logger.info(f"Updated embeddings for batch {i // batch_size + 1}")
        
        if db is None:
            async with AsyncSessionLocal() as session:
                await _update_batch(session)
        else:
            await _update_batch(db)
        
        logger.info("Embeddings update completed")
