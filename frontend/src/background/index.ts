/**
 * Background script for PrompTab Chrome Extension
 * Handles extension lifecycle, context menus, keyboard shortcuts, and message routing
 */
import browser from 'webextension-polyfill';
import { backgroundLogger } from '@utils/logger';

/**
 * Safe browser API wrapper to handle different extension environments
 * Provides fallback behavior when browser APIs are not available
 */
const safeBrowser = {
	tabs: {
		/**
		 * Safely query browser tabs
		 * @param queryInfo - Tab query parameters
		 * @returns Promise with tab array or empty array on error
		 */
		query: async (queryInfo: any) => {
			try {
				if (!browser?.tabs?.query) {
					backgroundLogger.debug('Browser tabs API not available');
					return [];
				}
				return await browser.tabs.query(queryInfo);
			} catch (error) {
				backgroundLogger.debug('Safe tabs.query error (expected):', error);
				return [];
			}
		},
		/**
		 * Safely send message to a specific tab
		 * @param tabId - Target tab ID
		 * @param message - Message to send
		 * @returns Promise with response or null on error
		 */
		sendMessage: async (tabId: number, message: any) => {
			try {
				if (!browser?.tabs?.sendMessage) {
					backgroundLogger.debug('Browser tabs.sendMessage API not available');
					return null;
				}
				return await browser.tabs.sendMessage(tabId, message);
			} catch (error) {
				backgroundLogger.debug('Safe tabs.sendMessage error (expected):', error);
				return null;
			}
		},
		/**
		 * Safely create a new tab
		 * @param createProperties - Tab creation properties
		 * @returns Promise with created tab or null on error
		 */
		create: async (createProperties: any) => {
			try {
				if (!browser?.tabs?.create) {
					backgroundLogger.debug('Browser tabs.create API not available');
					return null;
				}
				return await browser.tabs.create(createProperties);
			} catch (error) {
				backgroundLogger.debug('Safe tabs.create error:', error);
				return null;
			}
		}
	},
	storage: {
		local: {
			/**
			 * Safely set items in local storage
			 * @param items - Items to store
			 */
			set: async (items: any) => {
				try {
					if (!browser?.storage?.local) {
						backgroundLogger.debug('Browser local storage not available');
						return;
					}
					await browser.storage.local.set(items);
				} catch (error) {
					backgroundLogger.debug('Safe storage.local.set error:', error);
				}
			},
			/**
			 * Safely get items from local storage
			 * @param keys - Keys to retrieve
			 * @returns Promise with stored items or empty object on error
			 */
			get: async (keys: any) => {
				try {
					if (!browser?.storage?.local) {
						backgroundLogger.debug('Browser local storage not available');
						return {};
					}
					return await browser.storage.local.get(keys);
				} catch (error) {
					backgroundLogger.debug('Safe storage.local.get error:', error);
					return {};
				}
			},
			/**
			 * Safely remove items from local storage
			 * @param keys - Keys to remove
			 */
			remove: async (keys: any) => {
				try {
					if (!browser?.storage?.local) {
						backgroundLogger.debug('Browser local storage not available');
						return;
					}
					await browser.storage.local.remove(keys);
				} catch (error) {
					backgroundLogger.debug('Safe storage.local.remove error:', error);
				}
			}
		},
		sync: {
			/**
			 * Safely set items in sync storage
			 * @param items - Items to store
			 */
			set: async (items: any) => {
				try {
					if (!browser?.storage?.sync) {
						backgroundLogger.debug('Browser sync storage not available');
						return;
					}
					await browser.storage.sync.set(items);
				} catch (error) {
					backgroundLogger.debug('Safe storage.sync.set error:', error);
				}
			},
			/**
			 * Safely get items from sync storage
			 * @param keys - Keys to retrieve
			 * @returns Promise with stored items or empty object on error
			 */
			get: async (keys: any) => {
				try {
					if (!browser?.storage?.sync) {
						backgroundLogger.debug('Browser sync storage not available');
						return {};
					}
					return await browser.storage.sync.get(keys);
				} catch (error) {
					backgroundLogger.debug('Safe storage.sync.get error:', error);
					return {};
				}
			}
		}
	}
};

/**
 * Handle extension installation and setup
 * Creates context menu items and sets default preferences
 */
browser.runtime.onInstalled.addListener((details) => {
	backgroundLogger.info('PrompTab extension installed:', details.reason);

	// Create context menu items
	browser.contextMenus.create({
		id: 'optimize-selected-text',
		title: 'Оптимизировать промпт',
		contexts: ['selection'],
	});

	browser.contextMenus.create({
		id: 'open-promptab',
		title: 'Открыть PrompTab',
		contexts: ['page'],
	});

	// Set default settings if first install
	if (details.reason === 'install') {
		safeBrowser.storage.sync.set({
			preferences: {
				language: 'ru',
				default_llm_provider: 'openai',
				auto_optimize: false,
				use_rag: true,
				theme: 'light',
			},
		});
	}
});

/**
 * Handle context menu clicks
 * Routes menu actions to appropriate handlers
 */
browser.contextMenus.onClicked.addListener(async (info, tab) => {
	switch (info.menuItemId) {
		case 'optimize-selected-text':
			if (info.selectionText && tab?.id) {
				// Send selected text to content script for optimization
				await safeBrowser.tabs.sendMessage(tab.id, {
					action: 'optimize-selection',
					text: info.selectionText,
				});
			}
			break;

		case 'open-promptab':
			// Open popup (fallback to opening options page if popup fails)
			try {
				if (browser.action?.openPopup) {
					browser.action.openPopup();
				} else {
					await safeBrowser.tabs.create({ url: browser.runtime.getURL('popup.html') });
				}
			} catch (error) {
				await safeBrowser.tabs.create({ url: browser.runtime.getURL('popup.html') });
			}
			break;
	}
});

/**
 * Handle keyboard shortcuts
 * Processes keyboard commands and routes to appropriate actions
 */
browser.commands.onCommand.addListener(async (command) => {
	switch (command) {
		case 'optimize-selection': {
			const tabs = await safeBrowser.tabs.query({ active: true, currentWindow: true });
			if (tabs[0]?.id) {
				await safeBrowser.tabs.sendMessage(tabs[0].id, {
					action: 'get-selection-and-optimize',
				});
			}
			break;
		}
	}
});

/**
 * Handle messages from content scripts and popup
 * Routes messages to appropriate handlers based on action type
 */
browser.runtime.onMessage.addListener(async (request, _sender, _sendResponse) => {
	backgroundLogger.info('Background received message:', request);

	switch (request.action) {
		case 'open-popup':
			try {
				if (browser.action?.openPopup) {
					browser.action.openPopup();
				} else {
					await safeBrowser.tabs.create({ url: browser.runtime.getURL('popup.html') });
				}
			} catch (error) {
				await safeBrowser.tabs.create({ url: browser.runtime.getURL('popup.html') });
			}
			return;

		case 'store-auth-token':
			// Store authentication token securely
			await safeBrowser.storage.local.set({
				auth_token: request.token,
				token_expires: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
			});
			return;

		case 'get-auth-token':
			return await safeBrowser.storage.local.get(['auth_token', 'token_expires']);

		case 'clear-auth-token':
			await safeBrowser.storage.local.remove(['auth_token', 'token_expires']);
			return;

		case 'store-recent-prompt':
			// Store recent prompt in storage
			return await safeBrowser.storage.local.get(['recent_prompts']);

		case 'get-recent-prompts':
			return await safeBrowser.storage.local.get(['recent_prompts']);

		case 'store-preferences':
			await safeBrowser.storage.sync.set({ preferences: request.preferences });
			return;

		case 'get-preferences':
			return await safeBrowser.storage.sync.get(['preferences']);

		default:
			backgroundLogger.warn('Unknown action:', request.action);
			return;
	}
});

/**
 * Handle tab updates to inject content scripts on relevant pages
 * Detects ChatGPT and Perplexity platforms and initializes platform-specific features
 */
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
	if (changeInfo.status === 'complete' && tab.url) {
		const isChatGPT = tab.url.includes('chat.openai.com');
		const isPerplexity = tab.url.includes('perplexity.ai');

		if (isChatGPT || isPerplexity) {
			// Content script should already be injected via manifest
			// But we can send a message to initialize platform-specific features
			await safeBrowser.tabs.sendMessage(tabId, {
				action: 'platform-detected',
				platform: isChatGPT ? 'chatgpt' : 'perplexity',
			});
		}
	}
});

/**
 * Handle web request interception for API calls (if needed)
 * This can be used to modify requests to LLM providers
 */

/**
 * Notification helper function
 * Creates browser notifications with specified parameters
 * @param title - Notification title
 * @param message - Notification message
 * @param type - Notification type (basic, image, list, progress)
 */
function showNotification(title: string, message: string, type: 'basic' | 'image' | 'list' | 'progress' = 'basic') {
	browser.notifications.create({
		type,
		iconUrl: '/icons/icon48.png',
		title,
		message,
	});
}

/**
 * Export helper for other modules
 * Makes showNotification available globally
 */
(globalThis as any).showNotification = showNotification;

backgroundLogger.info('PrompTab background script loaded'); 