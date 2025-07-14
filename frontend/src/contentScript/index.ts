/**
 * Content script for PrompTab Chrome Extension
 * Integrates with ChatGPT, Perplexity, and other AI platforms
 * Provides prompt injection and text selection functionality
 */
import browser from 'webextension-polyfill';
import { contentLogger } from '@utils/logger';

/**
 * Current platform being used (ChatGPT, Perplexity, or unknown)
 */
let currentPlatform: 'chatgpt' | 'perplexity' | 'unknown' = 'unknown';

/**
 * Whether the content script has been initialized
 */
let isInitialized = false;

/**
 * Safe wrapper for browser API calls
 * Provides fallback behavior when browser APIs are not available
 */
const safeBrowser = {
	runtime: {
		/**
		 * Safely send message to background script
		 * @param message - Message to send
		 * @returns Promise with response or null on error
		 */
		sendMessage: async (message: any) => {
			try {
				if (!browser?.runtime?.sendMessage) {
					contentLogger.debug('Browser runtime.sendMessage not available');
					return null;
				}
				return await browser.runtime.sendMessage(message);
			} catch (error) {
				contentLogger.debug('Safe runtime.sendMessage error:', error);
				return null;
			}
		},
	},
};

/**
 * Initialize content script based on current URL
 * Detects platform and sets up appropriate integration
 */
function initializePlatform() {
	if (isInitialized) return;

	const url = window.location.href;

	if (url.includes('chat.openai.com')) {
		currentPlatform = 'chatgpt';
		initializeChatGPT();
	} else if (url.includes('perplexity.ai')) {
		currentPlatform = 'perplexity';
		initializePerplexity();
	}

	isInitialized = true;
	contentLogger.info('PrompTab content script initialized for:', currentPlatform);
}

/**
 * ChatGPT specific initialization
 * Sets up ChatGPT interface integration
 */
function initializeChatGPT() {
	// Add PrompTab button to ChatGPT interface
	addPrompTabButton();

	// Watch for new chat sessions
	observeChatInterface();
}

/**
 * Perplexity specific initialization
 * Sets up Perplexity interface integration
 */
function initializePerplexity() {
	// Add PrompTab integration for Perplexity
	addPrompTabButton();

	// Watch for search interface changes
	observeSearchInterface();
}

/**
 * Add PrompTab button to the current platform's interface
 * Creates a floating button that opens the PrompTab popup
 */
function addPrompTabButton() {
	const existingButton = document.getElementById('promptab-button');
	if (existingButton) return;

	const button = document.createElement('button');
	button.id = 'promptab-button';
	button.innerHTML = `
		<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
			<path d="M12 2L2 7v10c0 5.55 3.84 9.15 9 10.5 5.16-1.35 9-4.95 9-10.5V7l-10-5z"/>
		</svg>
		PrompTab
	`;
	button.style.cssText = `
		position: fixed;
		top: 20px;
		right: 20px;
		z-index: 10000;
		background: #3B82F6;
		color: white;
		border: none;
		border-radius: 8px;
		padding: 8px 12px;
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 6px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.15);
		transition: all 0.2s ease;
	`;

	button.addEventListener('mouseenter', () => {
		button.style.transform = 'translateY(-1px)';
		button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
	});

	button.addEventListener('mouseleave', () => {
		button.style.transform = 'translateY(0)';
		button.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
	});

	button.addEventListener('click', async () => {
		await safeBrowser.runtime.sendMessage({ action: 'open-popup' });
	});

	document.body.appendChild(button);
}

/**
 * Get text input element for ChatGPT interface
 * Tries multiple selectors as ChatGPT UI may change
 * @returns ChatGPT textarea element or null if not found
 */
function getChatGPTTextarea(): HTMLTextAreaElement | null {
	// Try multiple selectors as ChatGPT UI may change
	const selectors = [
		'textarea[data-id]',
		'textarea[placeholder*="Message"]',
		'textarea[placeholder*="message"]',
		'#prompt-textarea',
		'div[contenteditable="true"]',
	];

	for (const selector of selectors) {
		const element = document.querySelector(selector) as HTMLTextAreaElement;
		if (element && element.offsetParent !== null) {
			return element;
		}
	}

	return null;
}

/**
 * Get text input element for Perplexity interface
 * Tries multiple selectors to find the search input
 * @returns Perplexity textarea element or null if not found
 */
function getPerplexityTextarea(): HTMLTextAreaElement | null {
	const selectors = [
		'textarea[placeholder*="Ask"]',
		'textarea[placeholder*="search"]',
		'input[type="text"]',
		'div[contenteditable="true"]',
	];

	for (const selector of selectors) {
		const element = document.querySelector(selector) as HTMLTextAreaElement;
		if (element && element.offsetParent !== null) {
			return element;
		}
	}

	return null;
}

/**
 * Inject prompt into the appropriate platform's input field
 * @param prompt - Prompt text to inject
 */
function injectPrompt(prompt: string) {
	let textarea: HTMLTextAreaElement | null = null;

	if (currentPlatform === 'chatgpt') {
		textarea = getChatGPTTextarea();
	} else if (currentPlatform === 'perplexity') {
		textarea = getPerplexityTextarea();
	}

	if (textarea) {
		// Clear existing content
		textarea.value = '';
		textarea.textContent = '';

		// Set new prompt
		textarea.value = prompt;
		textarea.textContent = prompt;

		// Trigger input events to notify the platform
		const events = ['input', 'change', 'keyup'];
		events.forEach(eventType => {
			const event = new Event(eventType, { bubbles: true });
			textarea!.dispatchEvent(event);
		});

		// Focus on the textarea
		textarea.focus();

		// Set cursor to end
		if (textarea.setSelectionRange) {
			textarea.setSelectionRange(prompt.length, prompt.length);
		}

		// Show success notification
		showTemporaryNotification('Промпт вставлен успешно!', 'success');
	} else {
		showTemporaryNotification('Не удалось найти поле ввода', 'error');
	}
}

/**
 * Get selected text from the current page
 * @returns Selected text as string
 */
function getSelectedText(): string {
	const selection = window.getSelection();
	return selection ? selection.toString().trim() : '';
}

/**
 * Observe chat interface changes for dynamic UI updates
 * Re-adds PrompTab button when interface changes
 */
function observeChatInterface() {
	const observer = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			if (mutation.type === 'childList') {
				// Re-add button if interface changed
				setTimeout(addPrompTabButton, 1000);
			}
		});
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});
}

/**
 * Observe search interface changes for dynamic UI updates
 * Currently uses same logic as chat interface observation
 */
function observeSearchInterface() {
	observeChatInterface(); // Same logic for now
}

/**
 * Show temporary notification overlay on the page
 * @param message - Notification message
 * @param type - Notification type (success, error, info)
 */
function showTemporaryNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
	const notification = document.createElement('div');
	notification.textContent = message;
	notification.style.cssText = `
		position: fixed;
		top: 80px;
		right: 20px;
		z-index: 10001;
		background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
		color: white;
		padding: 12px 16px;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 500;
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
		animation: slideIn 0.3s ease;
		max-width: 300px;
	`;

	// Add CSS animation
	if (!document.getElementById('promptab-styles')) {
		const style = document.createElement('style');
		style.id = 'promptab-styles';
		style.textContent = `
			@keyframes slideIn {
				from { transform: translateX(100%); opacity: 0; }
				to { transform: translateX(0); opacity: 1; }
			}
			@keyframes slideOut {
				from { transform: translateX(0); opacity: 1; }
				to { transform: translateX(100%); opacity: 0; }
			}
		`;
		document.head.appendChild(style);
	}

	document.body.appendChild(notification);

	// Remove after 3 seconds
	setTimeout(() => {
		notification.style.animation = 'slideOut 0.3s ease';
		setTimeout(() => {
			notification.remove();
		}, 300);
	}, 3000);
}

/**
 * Message listener for communication with background script
 * Handles various actions like text selection, prompt injection, and optimization
 */
browser.runtime.onMessage.addListener(async (request, _sender, _sendResponse) => {
	contentLogger.info('Content script received message:', request);

	switch (request.action) {
		case 'getSelectedText':
			return;

		case 'injectPrompt':
			injectPrompt(request.prompt);
			return;

		case 'optimize-selection': {
			const selectedText = getSelectedText();
			if (selectedText) {
				// Send to background for optimization
				await safeBrowser.runtime.sendMessage({
					action: 'optimize-text',
					text: selectedText,
				});
			}
			return;
		}

		case 'get-selection-and-optimize': {
			const selection = getSelectedText();
			if (selection) {
				await safeBrowser.runtime.sendMessage({
					action: 'open-popup',
					selectedText: selection,
				});
			} else {
				await safeBrowser.runtime.sendMessage({ action: 'open-popup' });
			}
			return;
		}

		case 'platform-detected':
			currentPlatform = request.platform;
			contentLogger.info('Platform detected:', currentPlatform);
			return;

		default:
			return;
	}
});

/**
 * Initialize content script when DOM is ready
 * Handles both immediate initialization and DOMContentLoaded event
 */
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initializePlatform);
} else {
	initializePlatform();
}

/**
 * Re-initialize on navigation for Single Page Applications (SPAs)
 * Detects URL changes and re-initializes the content script
 */
let lastUrl = location.href;
new MutationObserver(() => {
	const url = location.href;
	if (url !== lastUrl) {
		lastUrl = url;
		isInitialized = false;
		setTimeout(initializePlatform, 1000);
	}
}).observe(document, { subtree: true, childList: true });

contentLogger.info('PrompTab content script loaded'); 