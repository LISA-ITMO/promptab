/**
 * Error Boundary component for PrompTab
 * Catches and handles React errors with special handling for Chrome extension context
 * and React infinite loop errors (#185)
 */
import { Component, ErrorInfo, ReactNode } from 'react';
import {
	Box,
	Button,
	Paper,
	Typography,
	Alert,
} from '@mui/material';
import {
	Refresh as RefreshIcon,
	ArrowBack as BackIcon,
} from '@mui/icons-material';

/**
 * State interface for ErrorBoundary component
 */
interface ErrorBoundaryState {
	/** Whether an error has occurred */
	hasError: boolean;
	/** The error that was caught */
	error?: Error;
	/** Additional error information from React */
	errorInfo?: ErrorInfo;
	/** Count of errors encountered */
	errorCount?: number;
}

/**
 * Props interface for ErrorBoundary component
 */
interface ErrorBoundaryProps {
	/** Child components to render */
	children: ReactNode;
	/** Optional callback when error is reset */
	onReset?: () => void;
}

/**
 * Error Boundary class component for catching and handling React errors
 * Provides special handling for Chrome extension context and React infinite loops
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	/**
	 * Initialize ErrorBoundary with clean state
	 * @param props - ErrorBoundary properties
	 */
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = {
			hasError: false,
		};
	}

	/**
	 * Static method to derive state from caught error
	 * Implements comprehensive error suppression for extension and React infinite loop errors
	 * @param error - The error that was thrown
	 * @returns New state object
	 */
	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		// Comprehensive error suppression for extension and React infinite loop errors
		const errorMessage = error.message || '';
		const errorString = error.toString() || '';

		// Check for React error #185 (Maximum update depth exceeded)
		const isReactError185 = errorString.includes('185') ||
			errorMessage.includes('Maximum update depth') ||
			errorMessage.includes('nested updates') ||
			errorString.includes('nested updates');

		// Check for other problematic errors
		const isExtensionError = errorMessage.includes('extension context') ||
			errorMessage.includes('Could not establish connection') ||
			errorMessage.includes('Cannot access system pages') ||
			errorMessage.includes('system pages') ||
			errorMessage.includes('chrome://') ||
			errorMessage.includes('chrome-extension://') ||
			errorMessage.includes('permissions') ||
			errorMessage.includes('activeTab') ||
			errorMessage.includes('tabs');

		// Check for DOM errors that can cause issues
		const isDOMError = errorMessage.includes('DOMException') ||
			errorMessage.includes('removeChild') ||
			errorMessage.includes('Minified React error') ||
			errorString.includes('DOMException') ||
			errorString.includes('removeChild');

		// Suppress all problematic errors
		if (isReactError185 || isExtensionError || isDOMError) {
			console.debug('ErrorBoundary: Suppressed problematic error:', {
				message: errorMessage,
				isReactError185,
				isExtensionError,
				isDOMError,
				stack: error.stack?.substring(0, 200) + '...'
			});

			// For React #185 errors, try to force a clean render
			if (isReactError185) {
				console.debug('React #185 detected - infinite update loop prevented');
				// Return clean state to break the loop
				setTimeout(() => {
					try {
						// Force a clean re-render after a delay
						window.location.hash = '#clean-render-' + Date.now();
					} catch (cleanupError) {
						console.debug('Cleanup error (expected):', cleanupError);
					}
				}, 500);
			}

			// Return current state without setting error
			return { hasError: false };
		}

		return {
			hasError: true,
			error,
		};
	}

	/**
	 * Lifecycle method called when an error is caught
	 * Implements enhanced error handling with special focus on React #185 errors
	 * @param error - The error that was thrown
	 * @param errorInfo - Additional error information from React
	 */
	override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error('ErrorBoundary caught an error:', error, errorInfo);

		// Enhanced React #185 detection
		const errorMessage = error.message?.toLowerCase() || '';
		const errorStack = error.stack?.toLowerCase() || '';

		const isReactError185 =
			errorStack.includes('185') ||
			errorMessage.includes('maximum update depth') ||
			errorMessage.includes('nested updates') ||
			errorMessage.includes('too many re-renders') ||
			errorStack.includes('nested updates') ||
			errorStack.includes('maximum update depth');

		if (isReactError185) {
			console.warn('🚨 React Error #185 (Maximum update depth) detected in ErrorBoundary');

			// Immediate cleanup with longer delay to prevent re-triggering
			setTimeout(() => {
				try {
					// Clear any problematic DOM elements
					const problematicElements = document.querySelectorAll('[data-error-boundary-cleanup]');
					problematicElements.forEach(el => {
						try {
							el.remove();
						} catch (removeError) {
							console.debug('Element removal error (non-critical):', removeError);
						}
					});

					// Additional React #185 specific cleanup
					this.setState({
						hasError: false,
						error: undefined,
						errorInfo: undefined,
						errorCount: 0
					});

				} catch (cleanupError) {
					console.debug('ErrorBoundary cleanup error:', cleanupError);
				}
			}, 2000); // Longer delay for React #185
		} else {
			// Standard error handling for non-React #185 errors
			setTimeout(() => {
				this.setState({
					hasError: true,
					error,
					errorInfo,
					errorCount: (this.state.errorCount || 0) + 1
				});
			}, 100);
		}
	}

	/**
	 * Handle error reset - clear error state and call optional reset callback
	 */
	handleReset = () => {
		this.setState({
			hasError: false,
			error: undefined,
			errorInfo: undefined,
		});
		if (this.props.onReset) {
			this.props.onReset();
		}
	};

	/**
	 * Handle extension reload - reload the popup window
	 */
	handleReload = () => {
		// Reload the extension popup
		window.location.reload();
	};

	/**
	 * Render method - shows error UI when error occurs, otherwise renders children
	 * @returns JSX element
	 */
	override render() {
		if (this.state.hasError) {
			return (
				<Box sx={{ width: 400, minHeight: 500, p: 3 }}>
					<Paper elevation={0} sx={{ p: 3, textAlign: 'center' }}>
						<Typography variant="h6" color="error" gutterBottom>
							Произошла ошибка
						</Typography>

						<Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
							<Typography variant="body2">
								{this.state.error?.message || 'Неизвестная ошибка'}
							</Typography>
						</Alert>

						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
							<Button
								variant="contained"
								onClick={this.handleReset}
								startIcon={<BackIcon />}
								fullWidth
							>
								Попробовать снова
							</Button>

							<Button
								variant="outlined"
								onClick={this.handleReload}
								startIcon={<RefreshIcon />}
								fullWidth
							>
								Перезагрузить расширение
							</Button>
						</Box>
					</Paper>
				</Box>
			);
		}

		return this.props.children;
	}
} 