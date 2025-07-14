-- Create pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schema
CREATE SCHEMA IF NOT EXISTS promptab;

-- Users table
CREATE TABLE IF NOT EXISTS promptab.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Knowledge base table (for RAG)
CREATE TABLE IF NOT EXISTS promptab.knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    embedding vector(384), -- Dimension for all-MiniLM-L6-v2
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vector search index
CREATE INDEX IF NOT EXISTS knowledge_base_embedding_idx 
ON promptab.knowledge_base 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- User prompts table
CREATE TABLE IF NOT EXISTS promptab.user_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES promptab.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    original_prompt TEXT NOT NULL,
    optimized_prompt TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    category VARCHAR(100),
    tags TEXT[],
    is_template BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Variables table
CREATE TABLE IF NOT EXISTS promptab.variables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES promptab.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    default_value TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

-- Prompt history table
CREATE TABLE IF NOT EXISTS promptab.prompt_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES promptab.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    original_prompt TEXT NOT NULL,
    optimized_prompt TEXT NOT NULL,
    llm_provider VARCHAR(50),
    llm_model VARCHAR(100),
    optimization_techniques TEXT[],
    rag_sources UUID[],
    response_time_ms INTEGER,
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Feedback table
CREATE TABLE IF NOT EXISTS promptab.feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES promptab.users(id) ON DELETE CASCADE,
    prompt_history_id UUID REFERENCES promptab.prompt_history(id) ON DELETE CASCADE,
    rating VARCHAR(20) CHECK (rating IN ('like', 'dislike')),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_prompts_user_id ON promptab.user_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_prompts_category ON promptab.user_prompts(category);
CREATE INDEX IF NOT EXISTS idx_prompt_history_user_id ON promptab.prompt_history(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_history_session_id ON promptab.prompt_history(session_id);
CREATE INDEX IF NOT EXISTS idx_variables_user_id ON promptab.variables(user_id);

-- Trigger for updating updated_at
CREATE OR REPLACE FUNCTION promptab.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE
    ON promptab.users FOR EACH ROW EXECUTE FUNCTION promptab.update_updated_at_column();

CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE
    ON promptab.knowledge_base FOR EACH ROW EXECUTE FUNCTION promptab.update_updated_at_column();

CREATE TRIGGER update_user_prompts_updated_at BEFORE UPDATE
    ON promptab.user_prompts FOR EACH ROW EXECUTE FUNCTION promptab.update_updated_at_column();

CREATE TRIGGER update_variables_updated_at BEFORE UPDATE
    ON promptab.variables FOR EACH ROW EXECUTE FUNCTION promptab.update_updated_at_column(); 