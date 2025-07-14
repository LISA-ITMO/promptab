
/**
 * Popup entry point for PrompTab Chrome Extension
 * Initializes React app with QueryClient provider for data fetching
 */
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';

/**
 * Simple QueryClient without aggressive options that could cause cycles
 * Configured for Chrome extension environment with minimal retries and refetching
 */
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: false,
			refetchOnWindowFocus: false,
			staleTime: 5 * 60 * 1000, // 5 minutes
		},
		mutations: {
			retry: false,
		},
	},
});

/**
 * SAFE initialization with minimal providers
 * Sets up React app with error handling for Chrome extension environment
 */
function initializeApp() {
	try {
		const rootElement = document.getElementById('root');
		if (!rootElement) {
			console.error('Root element not found');
			return;
		}

		// Simple React rendering with minimal providers
		const root = ReactDOM.createRoot(rootElement);
		root.render(
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>
		);

		console.log('App initialized with React Query');
	} catch (error) {
		console.error('App initialization error:', error);
	}
}

/**
 * Initialize when DOM is ready
 * Handles both immediate initialization and DOMContentLoaded event
 */
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initializeApp);
} else {
	initializeApp();
} 