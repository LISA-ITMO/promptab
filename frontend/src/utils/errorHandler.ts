// Centralized error handling utility for PrompTab
import { logger } from './logger';

export interface ErrorInfo {
	message: string;
	code?: string;
	context?: string;
	originalError?: unknown;
}

export class PrompTabError extends Error {
	code: string;
	context: string;
	originalError?: unknown;

	constructor(info: ErrorInfo) {
		super(info.message);
		this.name = 'PrompTabError';
		this.code = info.code || 'UNKNOWN_ERROR';
		this.context = info.context || 'general';
		this.originalError = info.originalError;
	}
}

// Error handler function
export function handleError(error: unknown, context: string = 'general'): PrompTabError {
	let errorInfo: ErrorInfo;

	if (error instanceof PrompTabError) {
		return error;
	}

	if (error instanceof Error) {
		errorInfo = {
			message: error.message,
			context,
			originalError: error,
		};
	} else if (typeof error === 'string') {
		errorInfo = {
			message: error,
			context,
		};
	} else {
		errorInfo = {
			message: 'An unknown error occurred',
			context,
			originalError: error,
		};
	}

	const promptabError = new PrompTabError(errorInfo);
	logger.error(`[${context}] ${promptabError.message}`, promptabError.originalError);

	return promptabError;
}

// Async error wrapper
export async function withErrorHandling<T>(
	fn: () => Promise<T>,
	context: string,
	fallback?: T
): Promise<T> {
	try {
		return await fn();
	} catch (error) {
		const promptabError = handleError(error, context);

		if (fallback !== undefined) {
			logger.warn(`[${context}] Using fallback value due to error: ${promptabError.message}`);
			return fallback;
		}

		throw promptabError;
	}
}

// Sync error wrapper
export function withSyncErrorHandling<T>(
	fn: () => T,
	context: string,
	fallback?: T
): T {
	try {
		return fn();
	} catch (error) {
		const promptabError = handleError(error, context);

		if (fallback !== undefined) {
			logger.warn(`[${context}] Using fallback value due to error: ${promptabError.message}`);
			return fallback;
		}

		throw promptabError;
	}
}

// User-friendly error messages
export function getUserFriendlyMessage(error: unknown): string {
	if (error instanceof PrompTabError) {
		switch (error.context) {
			case 'auth':
				return 'Authentication failed. Please check your credentials.';
			case 'api':
				return 'Service temporarily unavailable. Please try again later.';
			case 'storage':
				return 'Unable to save data. Please check your browser settings.';
			case 'network':
				return 'Network connection error. Please check your internet connection.';
			default:
				return error.message;
		}
	}

	if (error instanceof Error) {
		return error.message;
	}

	return 'An unexpected error occurred. Please try again.';
} 