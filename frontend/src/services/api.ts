import axios, { AxiosInstance, AxiosError } from 'axios';
import { getStoredToken, removeStoredToken } from '@utils/storage';
import {
	SavePromptRequest,
	UpdatePromptRequest,
	UpdateProfileRequest,
	PromptMetadata,
	SuggestedVariable
} from '../types';

// Types
export interface ApiError {
	detail: string;
	error_code?: string;
}

export interface LoginRequest {
	username: string;
	password: string;
}

export interface RegisterRequest {
	email: string;
	username: string;
	password: string;
}

export interface TokenResponse {
	access_token: string;
	refresh_token: string;
	token_type: string;
}

export interface OptimizeRequest {
	prompt: string;
	techniques?: string[];
	use_rag?: boolean;
	llm_provider?: string;
	language?: 'auto' | 'ru' | 'en';
}

export interface OptimizeResponse {
	original: string;
	optimized: string;
	techniques_used: string[];
	rag_sources: Array<{
		id: string;
		title: string;
		content: string;
		category?: string;
		similarity: number;
	}>;
	structure: {
		role: string;
		task: string;
		context: string;
		instructions: string;
		constraints: string;
		tone: string;
		full_prompt: string;
	};
	variables: SuggestedVariable[];
	metadata: PromptMetadata;
}

export interface BackendVariable {
	id: string;
	name: string;
	description?: string;
	default_value?: string;
	category_id?: string;
	category?: VariableCategory;
	user_id: string;
	created_at: string;
	updated_at: string;
}

export interface VariableCategory {
	id: string;
	name: string;
	description?: string;
	color?: string;
	icon?: string;
	user_id: string;
	created_at: string;
	updated_at: string;
}

export interface CreateVariableRequest {
	name: string;
	description?: string;
	default_value?: string;
	category_id?: string;
}

export interface UpdateVariableRequest {
	name?: string;
	description?: string;
	default_value?: string;
	category_id?: string;
}

export interface CreateVariableCategoryRequest {
	name: string;
	description?: string;
	color?: string;
	icon?: string;
}

class ApiService {
	private api: AxiosInstance;

	constructor() {
		this.api = axios.create({
			baseURL: 'http://89.169.186.91:8000/api/v1',
			timeout: 30000,
			headers: {
				'Content-Type': 'application/json',
			},
		});

		// Request interceptor to add auth token
		this.api.interceptors.request.use(
			async (config) => {
				const token = await getStoredToken();
				if (token) {
					config.headers.Authorization = `Bearer ${token}`;
				}
				return config;
			},
			(error) => Promise.reject(error)
		);

		// Response interceptor to handle errors
		this.api.interceptors.response.use(
			(response) => response,
			async (error: AxiosError<ApiError>) => {
				if (error.response?.status === 401) {
					// Token expired or invalid
					await removeStoredToken();
					// Dispatch event to notify components
					window.dispatchEvent(new CustomEvent('auth:logout'));
				}
				return Promise.reject(error);
			}
		);
	}

	// Auth endpoints
	async login(data: LoginRequest): Promise<TokenResponse> {
		const response = await this.api.post<TokenResponse>('/auth/login/custom', data);
		return response.data;
	}

	async register(data: RegisterRequest) {
		const response = await this.api.post('/auth/register', data);
		return response.data;
	}

	async logout() {
		const response = await this.api.post('/auth/logout');
		return response.data;
	}

	async refreshToken(refreshToken: string): Promise<TokenResponse> {
		const response = await this.api.post<TokenResponse>('/auth/refresh', {
			refresh_token: refreshToken,
		});
		return response.data;
	}

	// Prompt optimization
	async optimizePrompt(data: OptimizeRequest): Promise<OptimizeResponse> {
		const response = await this.api.post<OptimizeResponse>('/prompts/optimize', data);
		return response.data;
	}

	// Save prompt
	async savePrompt(data: SavePromptRequest) {
		const response = await this.api.post('/prompts/save', data);
		return response.data;
	}

	// Get user prompts
	async getMyPrompts(params?: {
		skip?: number;
		limit?: number;
		category?: string;
		is_template?: boolean;
		search?: string;
	}) {
		const response = await this.api.get('/prompts/my', { params });
		return response.data;
	}

	// Get prompt by ID
	async getPrompt(id: string) {
		const response = await this.api.get(`/prompts/${id}`);
		return response.data;
	}

	// Update prompt
	async updatePrompt(id: string, data: UpdatePromptRequest) {
		const response = await this.api.put(`/prompts/${id}`, data);
		return response.data;
	}

	// Delete prompt
	async deletePrompt(id: string) {
		const response = await this.api.delete(`/prompts/${id}`);
		return response.data;
	}

	// Get public prompts
	async getPublicPrompts(params?: {
		skip?: number;
		limit?: number;
		category?: string;
		sort_by?: 'usage_count' | 'created_at' | 'updated_at';
	}) {
		const response = await this.api.get('/prompts/public/explore', { params });
		return response.data;
	}

	// User profile
	async getProfile() {
		const response = await this.api.get('/users/me');
		return response.data;
	}

	async updateProfile(data: UpdateProfileRequest) {
		const response = await this.api.put('/users/me', data);
		return response.data;
	}

	// Variables
	async getVariables(params?: { category_id?: string }): Promise<BackendVariable[]> {
		const response = await this.api.get('/variables', { params });
		return response.data;
	}

	async createVariable(data: CreateVariableRequest): Promise<BackendVariable> {
		const response = await this.api.post('/variables', data);
		return response.data;
	}

	async updateVariable(id: string, data: UpdateVariableRequest): Promise<BackendVariable> {
		const response = await this.api.put(`/variables/${id}`, data);
		return response.data;
	}

	async deleteVariable(id: string): Promise<void> {
		const response = await this.api.delete(`/variables/${id}`);
		return response.data;
	}

	// Variable categories
	async getVariableCategories(): Promise<VariableCategory[]> {
		const response = await this.api.get('/variables/categories');
		return response.data;
	}

	async createVariableCategory(data: CreateVariableCategoryRequest): Promise<VariableCategory> {
		const response = await this.api.post('/variables/categories', data);
		return response.data;
	}

	// History
	async getHistory(params?: {
		skip?: number;
		limit?: number;
		session_id?: string;
	}) {
		const response = await this.api.get('/history', { params });
		return response.data;
	}

	// Feedback
	async submitFeedback(data: {
		prompt_history_id: string;
		rating: 'like' | 'dislike';
		comment?: string;
	}) {
		const response = await this.api.post('/prompts/feedback', data);
		return response.data;
	}
}

export const apiService = new ApiService(); 