/**
 * TypeScript type definitions for PrompTab Chrome Extension
 * Contains all interfaces and types used throughout the application
 */

/**
 * User account information
 */
export interface User {
	/** Unique user identifier */
	id: string;
	/** Username for login and display */
	username: string;
	/** User email address */
	email: string;
	/** Whether the user account is active */
	is_active: boolean;
	/** Account creation timestamp */
	created_at: string;
	/** Last account update timestamp */
	updated_at: string;
}

/**
 * User-defined variable for prompt templates
 */
export interface Variable {
	/** Unique variable identifier */
	id: string;
	/** Variable name used in templates */
	name: string;
	/** Optional description of the variable's purpose */
	description?: string;
	/** Default value for the variable */
	default_value?: string;
	/** Category ID for organization */
	category_id?: string;
	/** User ID who owns this variable */
	user_id: string;
	/** Variable creation timestamp */
	created_at: string;
	/** Last variable update timestamp */
	updated_at: string;
}

/**
 * Category for organizing variables
 */
export interface VariableCategory {
	/** Unique category identifier */
	id: string;
	/** Category name */
	name: string;
	/** Optional category description */
	description?: string;
	/** Color for UI display */
	color?: string;
	/** Icon identifier for UI display */
	icon?: string;
	/** User ID who owns this category */
	user_id: string;
	/** Category creation timestamp */
	created_at: string;
	/** Last category update timestamp */
	updated_at: string;
}

/**
 * Saved prompt with metadata
 */
export interface Prompt {
	/** Unique prompt identifier */
	id: string;
	/** Prompt title for display */
	title: string;
	/** Original user input prompt */
	original_prompt: string;
	/** AI-optimized version of the prompt */
	optimized_prompt: string;
	/** Associated variables for this prompt */
	variables?: Variable[];
	/** Category for organization */
	category?: string;
	/** Tags for search and filtering */
	tags?: string[];
	/** Whether this prompt is a reusable template */
	is_template: boolean;
	/** Whether this prompt is publicly visible */
	is_public: boolean;
	/** Number of times this prompt has been used */
	usage_count: number;
	/** User ID who owns this prompt */
	user_id: string;
	/** Prompt creation timestamp */
	created_at: string;
	/** Last prompt update timestamp */
	updated_at: string;
}

/**
 * History record of prompt optimization
 */
export interface PromptHistory {
	/** Unique history record identifier */
	id: string;
	/** Original prompt text */
	original_prompt: string;
	/** Optimized prompt text */
	optimized_prompt: string;
	/** Optimization techniques applied */
	techniques_used: string[];
	/** LLM provider used for optimization */
	llm_provider: string;
	/** Session identifier for grouping related optimizations */
	session_id?: string;
	/** User ID who performed the optimization */
	user_id: string;
	/** Optimization timestamp */
	created_at: string;
}

/**
 * Request payload for prompt optimization
 */
export interface OptimizeRequest {
	/** Original prompt to optimize */
	prompt: string;
	/** Specific optimization techniques to apply */
	techniques?: string[];
	/** Whether to use RAG for knowledge enrichment */
	use_rag?: boolean;
	/** LLM provider to use for optimization */
	llm_provider?: string;
	/** Language of the prompt */
	language?: 'auto' | 'ru' | 'en';
}

/**
 * Response from prompt optimization
 */
export interface OptimizeResponse {
	/** Original prompt text */
	original: string;
	/** Optimized prompt text */
	optimized: string;
	/** Techniques used during optimization */
	techniques_used: string[];
	/** Knowledge base sources used for RAG */
	rag_sources: RAGSource[];
	/** Structured breakdown of the prompt */
	structure: PromptStructure;
	/** Variables extracted from the prompt */
	variables: SuggestedVariable[];
	/** Additional optimization metadata */
	metadata: Record<string, any>;
}

/**
 * Knowledge base source used in RAG
 */
export interface RAGSource {
	/** Unique source identifier */
	id: string;
	/** Source title */
	title: string;
	/** Source content text */
	content: string;
	/** Source category */
	category?: string;
	/** Similarity score with the query */
	similarity: number;
}

/**
 * Structured breakdown of a prompt
 */
export interface PromptStructure {
	/** Role or persona for the AI */
	role: string;
	/** Main task to accomplish */
	task: string;
	/** Contextual information */
	context: string;
	/** Specific instructions */
	instructions: string;
	/** Constraints and limitations */
	constraints: string;
	/** Tone and style */
	tone: string;
	/** Complete structured prompt */
	full_prompt: string;
}

/**
 * Variable suggested by AI during optimization
 */
export interface SuggestedVariable {
	/** Original text that can be replaced */
	text: string;
	/** Suggested variable name */
	suggested_name: string;
	/** Variable type or category */
	type: string;
}

/**
 * Request payload for saving a prompt
 */
export interface SavePromptRequest {
	/** Prompt title */
	title: string;
	/** Original prompt text */
	original_prompt: string;
	/** Optimized prompt text */
	optimized_prompt: string;
	/** Variables to associate with the prompt */
	variables?: SuggestedVariable[];
	/** Category for organization */
	category?: string;
	/** Tags for search and filtering */
	tags?: string[];
	/** Whether to save as a template */
	is_template?: boolean;
	/** Whether to make publicly visible */
	is_public?: boolean;
}

/**
 * Request payload for updating a prompt
 */
export interface UpdatePromptRequest {
	/** New prompt title */
	title?: string;
	/** Updated optimized prompt */
	optimized_prompt?: string;
	/** Updated variables */
	variables?: SuggestedVariable[];
	/** New category */
	category?: string;
	/** Updated tags */
	tags?: string[];
	/** Whether to mark as template */
	is_template?: boolean;
	/** Whether to make public */
	is_public?: boolean;
}

/**
 * Request payload for updating user profile
 */
export interface UpdateProfileRequest {
	/** New username */
	username?: string;
	/** New email address */
	email?: string;
	/** Updated user preferences */
	preferences?: Partial<UserPreferences>;
}

/**
 * Metadata about prompt optimization
 */
export interface PromptMetadata {
	/** Time taken for optimization in milliseconds */
	optimization_time_ms?: number;
	/** LLM provider used */
	llm_provider?: string;
	/** Detected language of the prompt */
	language_detected?: string;
	/** Confidence score of the optimization */
	confidence_score?: number;
	/** Version of the optimization algorithm */
	version?: string;
}

/**
 * Recent prompt for quick access
 */
export interface RecentPrompt {
	/** Unique identifier */
	id: string;
	/** Original prompt text */
	original: string;
	/** Optimized prompt text */
	optimized: string;
	/** Timestamp when created */
	timestamp: number;
}

/**
 * User preferences and settings
 */
export interface UserPreferences {
	/** Preferred language */
	language: 'ru' | 'en';
	/** Default LLM provider */
	default_llm_provider: 'openai' | 'deepseek' | 'perplexity' | 'ollama';
	/** Whether to auto-optimize prompts */
	auto_optimize: boolean;
	/** Whether to use RAG by default */
	use_rag: boolean;
	/** UI theme preference */
	theme: 'light' | 'dark' | 'auto';
}

/**
 * Chrome extension message structure
 */
export interface ChromeMessage {
	/** Action to perform */
	action: string;
	/** Optional data payload */
	data?: any;
	/** Additional properties */
	[key: string]: any;
}

/**
 * Data structure for Chrome storage
 */
export interface ChromeStorageData {
	/** Authentication token */
	auth_token?: string;
	/** Token expiration timestamp */
	token_expires?: number;
	/** Recent prompts for quick access */
	recent_prompts?: RecentPrompt[];
	/** User preferences */
	preferences?: UserPreferences;
}

/**
 * Chrome API extension types
 */
declare global {
	interface Window {
		chrome: typeof chrome;
	}
}

/**
 * Supported platforms for prompt injection
 */
export type Platform = 'chatgpt' | 'perplexity' | 'unknown';

/**
 * Platform-specific message structure
 */
export interface PlatformMessage extends ChromeMessage {
	/** Specific platform action */
	action: 'getSelectedText' | 'injectPrompt' | 'optimize-selection' | 'platform-detected';
	/** Selected text from the page */
	text?: string;
	/** Prompt to inject */
	prompt?: string;
	/** Detected platform */
	platform?: Platform;
}

/**
 * Prompt template for quick access
 */
export interface PromptTemplate {
	/** Unique template identifier */
	id: string;
	/** Icon identifier for display */
	icon: string;
	/** Template title */
	title: string;
	/** Template description */
	description: string;
	/** Template category */
	category: string;
	/** Template prompt text */
	prompt: string;
	/** Variables used in the template */
	variables?: string[];
	/** Tags for search and filtering */
	tags?: string[];
	/** Whether this is a popular template */
	is_popular?: boolean;
}

/**
 * Result of prompt optimization
 */
export interface OptimizationResult {
	/** Original prompt text */
	original: string;
	/** Optimized prompt text */
	optimized: string;
	/** Techniques used during optimization */
	techniques_used: string[];
	/** Knowledge base sources used */
	rag_sources: RAGSource[];
	/** Structured breakdown of the prompt */
	structure: PromptStructure;
	/** Variables extracted from the prompt */
	variables: SuggestedVariable[];
	/** Optimization metadata */
	metadata: PromptMetadata;
}

/**
 * History item from API
 */
export interface ApiHistoryItem {
	/** Unique history item identifier */
	id: string;
	/** Original prompt text */
	original_prompt: string;
	/** Optimized prompt text */
	optimized_prompt: string;
	/** Techniques used for optimization */
	techniques_used: string[];
	/** LLM provider used */
	llm_provider: string;
	/** Session identifier */
	session_id?: string;
	/** User identifier */
	user_id: string;
	/** Creation timestamp */
	created_at: string;
}

/**
 * History prompt with source information
 */
export interface HistoryPrompt extends RecentPrompt {
	/** Source of the history item */
	source: 'local' | 'api';
	/** Creation timestamp */
	created_at: string;
} 