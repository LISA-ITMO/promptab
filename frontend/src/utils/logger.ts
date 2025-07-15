// Centralized logging utility for PrompTab
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
	enabled: boolean;
	level: LogLevel;
	prefix: string;
}

class Logger {
	private config: LoggerConfig;

	constructor(config: Partial<LoggerConfig> = {}) {
		// For Chrome extensions, always enable logging in development mode
		// Chrome extensions don't have access to process.env, so we use a simple check
		const isDevelopment = !('chrome' in globalThis && chrome.runtime && chrome.runtime.getManifest);

		this.config = {
			enabled: isDevelopment,
			level: 'debug',
			prefix: '[PrompTab]',
			...config,
		};
	}

	private shouldLog(level: LogLevel): boolean {
		if (!this.config.enabled) return false;

		const levels: Record<LogLevel, number> = {
			debug: 0,
			info: 1,
			warn: 2,
			error: 3,
		};

		return levels[level] >= levels[this.config.level];
	}

	private formatMessage(level: LogLevel, message: string, ...args: unknown[]): [string, ...unknown[]] {
		const timestamp = new Date().toISOString().substring(11, 23);
		const levelStr = level.toUpperCase().padEnd(5);
		return [`${this.config.prefix} ${timestamp} ${levelStr} ${message}`, ...args];
	}

	debug(message: string, ...args: unknown[]): void {
		if (this.shouldLog('debug')) {
			console.debug(...this.formatMessage('debug', message, ...args));
		}
	}

	info(message: string, ...args: unknown[]): void {
		if (this.shouldLog('info')) {
			console.info(...this.formatMessage('info', message, ...args));
		}
	}

	warn(message: string, ...args: unknown[]): void {
		if (this.shouldLog('warn')) {
			console.warn(...this.formatMessage('warn', message, ...args));
		}
	}

	error(message: string, error?: unknown, ...args: unknown[]): void {
		if (this.shouldLog('error')) {
			if (error instanceof Error) {
				console.error(...this.formatMessage('error', message, error.message, error.stack, ...args));
			} else {
				console.error(...this.formatMessage('error', message, error, ...args));
			}
		}
	}

	// Special method for Chrome extension context
	extension(context: string, message: string, ...args: unknown[]): void {
		this.debug(`[${context}] ${message}`, ...args);
	}
}

// Create default logger instances
export const logger = new Logger();

// Create context-specific loggers
export const backgroundLogger = new Logger({ prefix: '[PrompTab:Background]' });
export const contentLogger = new Logger({ prefix: '[PrompTab:Content]' });
export const popupLogger = new Logger({ prefix: '[PrompTab:Popup]' });
export const storageLogger = new Logger({ prefix: '[PrompTab:Storage]' });

// Production-safe logging functions
export const safeLog = {
	debug: (message: string, ...args: unknown[]) => logger.debug(message, ...args),
	info: (message: string, ...args: unknown[]) => logger.info(message, ...args),
	warn: (message: string, ...args: unknown[]) => logger.warn(message, ...args),
	error: (message: string, error?: unknown, ...args: unknown[]) => logger.error(message, error, ...args),
}; 