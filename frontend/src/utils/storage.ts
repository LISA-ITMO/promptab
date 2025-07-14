import browser from 'webextension-polyfill';
import { storageLogger } from '@utils/logger';

// Safe browser API wrapper
const safeBrowser = {
	storage: {
		local: {
			get: async (keys?: string | string[] | Record<string, any>) => {
				try {
					if (!browser?.storage?.local) {
						storageLogger.debug('Browser storage not available');
						return {};
					}
					return await browser.storage.local.get(keys);
				} catch (error) {
					storageLogger.debug('Storage get error (fallback to empty):', error);
					return {};
				}
			},
			set: async (items: Record<string, any>) => {
				try {
					if (!browser?.storage?.local) {
						storageLogger.debug('Browser storage not available');
						return;
					}
					await browser.storage.local.set(items);
				} catch (error) {
					storageLogger.warn('Storage set error:', error);
					throw error;
				}
			},
			remove: async (keys: string | string[]) => {
				try {
					if (!browser?.storage?.local) {
						storageLogger.debug('Browser storage not available');
						return;
					}
					await browser.storage.local.remove(keys);
				} catch (error) {
					storageLogger.warn('Storage remove error:', error);
					throw error;
				}
			},
			clear: async () => {
				try {
					if (!browser?.storage?.local) {
						storageLogger.debug('Browser storage not available');
						return;
					}
					await browser.storage.local.clear();
				} catch (error) {
					storageLogger.warn('Storage clear error:', error);
					throw error;
				}
			}
		},
		onChanged: {
			addListener: (callback: (changes: any) => void) => {
				try {
					if (!browser?.storage?.onChanged) {
						storageLogger.debug('Storage change listener not available');
						return;
					}
					browser.storage.onChanged.addListener(callback);
				} catch (error) {
					storageLogger.debug('Storage listener add error:', error);
				}
			},
			removeListener: (callback: (changes: any) => void) => {
				try {
					if (!browser?.storage?.onChanged) {
						storageLogger.debug('Storage change listener not available');
						return;
					}
					browser.storage.onChanged.removeListener(callback);
				} catch (error) {
					storageLogger.debug('Storage listener remove error:', error);
				}
			}
		}
	}
};

// Storage keys
const STORAGE_KEYS = {
	AUTH_TOKEN: 'auth_token',
	REFRESH_TOKEN: 'refresh_token',
	USER_PREFERENCES: 'user_preferences',
	RECENT_PROMPTS: 'recent_prompts',
	SELECTED_PROVIDER: 'selected_provider',
	LANGUAGE: 'language',
	THEME: 'theme',
	USER_VARIABLES: 'user_variables',
} as const;

// Types
export interface UserPreferences {
	language: 'ru' | 'en' | 'auto';
	theme: 'light' | 'dark' | 'auto';
	defaultProvider: string;
	autoOptimize: boolean;
	showNotifications: boolean;
}

export interface RecentPrompt {
	id: string;
	original: string;
	optimized: string;
	timestamp: number;
}

export interface UserVariable {
	id: string;
	name: string;
	value: string;
	description?: string;
	category?: string;
	timestamp: number;
}

// Token management
export async function getStoredToken(): Promise<string | null> {
	const result = await safeBrowser.storage.local.get(STORAGE_KEYS.AUTH_TOKEN);
	return result[STORAGE_KEYS.AUTH_TOKEN] || null;
}

export async function setStoredToken(token: string): Promise<void> {
	await safeBrowser.storage.local.set({ [STORAGE_KEYS.AUTH_TOKEN]: token });
}

export async function removeStoredToken(): Promise<void> {
	await safeBrowser.storage.local.remove([STORAGE_KEYS.AUTH_TOKEN, STORAGE_KEYS.REFRESH_TOKEN]);
}

export async function getRefreshToken(): Promise<string | null> {
	const result = await safeBrowser.storage.local.get(STORAGE_KEYS.REFRESH_TOKEN);
	return result[STORAGE_KEYS.REFRESH_TOKEN] || null;
}

export async function setRefreshToken(token: string): Promise<void> {
	await safeBrowser.storage.local.set({ [STORAGE_KEYS.REFRESH_TOKEN]: token });
}

// User preferences
export async function getUserPreferences(): Promise<UserPreferences> {
	const result = await safeBrowser.storage.local.get(STORAGE_KEYS.USER_PREFERENCES);
	return result[STORAGE_KEYS.USER_PREFERENCES] || {
		language: 'auto',
		theme: 'auto',
		defaultProvider: 'openai',
		autoOptimize: false,
		showNotifications: true,
	};
}

export async function setUserPreferences(preferences: Partial<UserPreferences>): Promise<void> {
	const current = await getUserPreferences();
	const updated = { ...current, ...preferences };
	await safeBrowser.storage.local.set({ [STORAGE_KEYS.USER_PREFERENCES]: updated });
}

// Recent prompts
export async function getRecentPrompts(): Promise<RecentPrompt[]> {
	const result = await safeBrowser.storage.local.get(STORAGE_KEYS.RECENT_PROMPTS);
	return result[STORAGE_KEYS.RECENT_PROMPTS] || [];
}

export async function addRecentPrompt(prompt: Omit<RecentPrompt, 'id' | 'timestamp'>): Promise<void> {
	const recent = await getRecentPrompts();
	const newPrompt: RecentPrompt = {
		...prompt,
		id: crypto.randomUUID(),
		timestamp: Date.now(),
	};

	// Keep only last 20 prompts
	const updated = [newPrompt, ...recent].slice(0, 20);
	await safeBrowser.storage.local.set({ [STORAGE_KEYS.RECENT_PROMPTS]: updated });
}

export async function clearRecentPrompts(): Promise<void> {
	await safeBrowser.storage.local.remove(STORAGE_KEYS.RECENT_PROMPTS);
}

// Selected provider
export async function getSelectedProvider(): Promise<string> {
	const result = await safeBrowser.storage.local.get(STORAGE_KEYS.SELECTED_PROVIDER);
	return result[STORAGE_KEYS.SELECTED_PROVIDER] || 'openai';
}

export async function setSelectedProvider(provider: string): Promise<void> {
	await safeBrowser.storage.local.set({ [STORAGE_KEYS.SELECTED_PROVIDER]: provider });
}

// Language
export async function getLanguage(): Promise<string> {
	const result = await safeBrowser.storage.local.get(STORAGE_KEYS.LANGUAGE);
	return result[STORAGE_KEYS.LANGUAGE] || 'ru';
}

export async function setLanguage(language: string): Promise<void> {
	await safeBrowser.storage.local.set({ [STORAGE_KEYS.LANGUAGE]: language });
}

// Theme
export async function getTheme(): Promise<'light' | 'dark' | 'auto'> {
	const result = await safeBrowser.storage.local.get(STORAGE_KEYS.THEME);
	return result[STORAGE_KEYS.THEME] || 'auto';
}

export async function setTheme(theme: 'light' | 'dark' | 'auto'): Promise<void> {
	await safeBrowser.storage.local.set({ [STORAGE_KEYS.THEME]: theme });
}

// Clear all storage
export async function clearAllStorage(): Promise<void> {
	await safeBrowser.storage.local.clear();
}

// User variables management
export async function getUserVariables(): Promise<UserVariable[]> {
	try {
		const stored = await safeBrowser.storage.local.get(STORAGE_KEYS.USER_VARIABLES);
		return stored[STORAGE_KEYS.USER_VARIABLES] || [];
	} catch (error) {
		storageLogger.error('Error getting user variables:', error);
		return [];
	}
}

export async function addUserVariable(variable: Omit<UserVariable, 'id' | 'timestamp'>): Promise<UserVariable> {
	const variables = await getUserVariables();
	const newVariable: UserVariable = {
		...variable,
		id: crypto.randomUUID(),
		timestamp: Date.now(),
	};

	// Check if variable with same name already exists
	const existingIndex = variables.findIndex(v => v.name === variable.name);
	if (existingIndex >= 0) {
		// Update existing variable
		variables[existingIndex] = newVariable;
	} else {
		// Add new variable
		variables.push(newVariable);
	}

	await safeBrowser.storage.local.set({ [STORAGE_KEYS.USER_VARIABLES]: variables });
	return newVariable;
}

export async function updateUserVariable(variable: UserVariable): Promise<UserVariable> {
	const variables = await getUserVariables();
	const index = variables.findIndex(v => v.id === variable.id);

	if (index >= 0) {
		const updatedVariable = { ...variable, timestamp: Date.now() };
		variables[index] = updatedVariable;
		await safeBrowser.storage.local.set({ [STORAGE_KEYS.USER_VARIABLES]: variables });
		return updatedVariable;
	}
	return variable;
}

export async function removeUserVariable(id: string): Promise<void> {
	const variables = await getUserVariables();
	const filtered = variables.filter(v => v.id !== id);
	await safeBrowser.storage.local.set({ [STORAGE_KEYS.USER_VARIABLES]: filtered });
}

export async function clearUserVariables(): Promise<void> {
	await safeBrowser.storage.local.remove(STORAGE_KEYS.USER_VARIABLES);
}

// Storage change listener
export function onStorageChange(
	callback: (changes: any) => void
): () => void {
	safeBrowser.storage.onChanged.addListener(callback);
	return () => safeBrowser.storage.onChanged.removeListener(callback);
} 