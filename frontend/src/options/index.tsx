/**
 * Options page for PrompTab Chrome Extension
 * Provides user interface for configuring extension preferences and settings
 */
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { I18nextProvider } from 'react-i18next';
import {
	Container,
	Paper,
	Typography,
	Box,
	Switch,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Button,
	Alert,
	Divider,
	Grid,
	Card,
	CardContent,
	FormControlLabel,
} from '@mui/material';
import i18n from '@utils/i18n';
import { UserPreferences } from '../types/index';
import browser from 'webextension-polyfill';

/**
 * QueryClient instance for data fetching in options page
 */
const queryClient = new QueryClient();

/**
 * Material-UI theme for consistent styling
 */
const theme = createTheme();

/**
 * Options page component for configuring PrompTab settings
 * Manages user preferences with Chrome storage integration
 */
function OptionsPage() {
	/**
	 * Current user preferences state
	 */
	const [preferences, setPreferences] = useState<UserPreferences>({
		language: 'ru',
		default_llm_provider: 'openai',
		auto_optimize: false,
		use_rag: true,
		theme: 'light',
	});

	/**
	 * Loading state for save operation
	 */
	const [saving, setSaving] = useState(false);

	/**
	 * Success state for save operation
	 */
	const [saved, setSaved] = useState(false);

	/**
	 * Load current preferences from Chrome storage
	 * Uses safe loading to prevent React dependency cycles
	 */
	useEffect(() => {
		// Load current preferences SAFELY to prevent cycles
		const loadPreferences = async () => {
			try {
				const result = await browser.storage.sync.get(['preferences']);
				if (result['preferences']) {
					// Use callback form to prevent dependency cycles
					setPreferences(prevPrefs => ({
						...prevPrefs,
						...result['preferences']
					}));
				}
			} catch (error) {
				console.error('Failed to load preferences:', error);
			}
		};

		loadPreferences();
	}, []); // Safe empty dependency array - no state dependencies

	/**
	 * Handle saving preferences to Chrome storage
	 * Shows success feedback and handles errors
	 */
	const handleSave = async () => {
		setSaving(true);
		try {
			await browser.storage.sync.set({ preferences });
			setSaved(true);
			setTimeout(() => setSaved(false), 3000);
		} catch (error) {
			console.error('Failed to save preferences:', error);
		} finally {
			setSaving(false);
		}
	};

	/**
	 * Reset preferences to default values
	 */
	const handleReset = () => {
		const defaultPrefs: UserPreferences = {
			language: 'ru',
			default_llm_provider: 'openai',
			auto_optimize: false,
			use_rag: true,
			theme: 'light',
		};
		setPreferences(defaultPrefs);
	};

	return (
		<Container maxWidth="md" sx={{ py: 4 }}>
			<Paper sx={{ p: 4 }}>
				<Typography variant="h4" component="h1" gutterBottom>
					PrompTab - Settings
				</Typography>
				<Typography variant="body1" color="text.secondary" gutterBottom>
					Configure the extension behavior to your needs
				</Typography>

				{saved && (
					<Alert severity="success" sx={{ mb: 3 }}>
						Settings saved successfully!
					</Alert>
				)}

				<Grid container spacing={3} sx={{ mt: 2 }}>
					{/* General settings */}
					<Grid item xs={12}>
						<Card>
							<CardContent>
								<Typography variant="h6" gutterBottom>
									General settings
								</Typography>

								<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
									<FormControl fullWidth>
										<InputLabel>Interface language</InputLabel>
										<Select
											value={preferences.language}
											onChange={(e) => setPreferences({
												...preferences,
												language: e.target.value as 'ru' | 'en'
											})}
											label="Interface language"
										>
											<MenuItem value="ru">Russian</MenuItem>
											<MenuItem value="en">English</MenuItem>
										</Select>
									</FormControl>

									<FormControl fullWidth>
										<InputLabel>Theme</InputLabel>
										<Select
											value={preferences.theme}
											onChange={(e) => setPreferences({
												...preferences,
												theme: e.target.value as 'light' | 'dark' | 'auto'
											})}
											label="Theme"
										>
											<MenuItem value="light">Light</MenuItem>
											<MenuItem value="dark">Dark</MenuItem>
											<MenuItem value="auto">Automatically</MenuItem>
										</Select>
									</FormControl>
								</Box>
							</CardContent>
						</Card>
					</Grid>

					{/* AI and optimization */}
					<Grid item xs={12}>
						<Card>
							<CardContent>
								<Typography variant="h6" gutterBottom>
									AI and prompt optimization
								</Typography>

								<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
									<FormControl fullWidth>
										<InputLabel>Default LLM provider</InputLabel>
										<Select
											value={preferences.default_llm_provider}
											onChange={(e) => setPreferences({
												...preferences,
												default_llm_provider: e.target.value as any
											})}
											label="Default LLM provider"
										>
											<MenuItem value="openai">OpenAI GPT</MenuItem>
											<MenuItem value="deepseek">DeepSeek</MenuItem>
											<MenuItem value="perplexity">Perplexity</MenuItem>
											<MenuItem value="ollama">Ollama (local)</MenuItem>
										</Select>
									</FormControl>

									<FormControlLabel
										control={
											<Switch
												checked={preferences.use_rag}
												onChange={(e) => setPreferences({
													...preferences,
													use_rag: e.target.checked
												})}
											/>
										}
										label="Use RAG (knowledge base) for improving prompts"
									/>

									<FormControlLabel
										control={
											<Switch
												checked={preferences.auto_optimize}
												onChange={(e) => setPreferences({
													...preferences,
													auto_optimize: e.target.checked
												})}
											/>
										}
										label="Automatic optimization of selected text"
									/>
								</Box>
							</CardContent>
						</Card>
					</Grid>

					{/* Hotkeys */}
					<Grid item xs={12}>
						<Card>
							<CardContent>
								<Typography variant="h6" gutterBottom>
									Hotkeys
								</Typography>

								<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
									<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
										<Typography variant="body2">
											Optimize selected text
										</Typography>
										<Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
											Ctrl+Shift+O
										</Typography>
									</Box>
									<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
										<Typography variant="body2">
											Open PrompTab
										</Typography>
										<Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
											Ctrl+Shift+P
										</Typography>
									</Box>
								</Box>
							</CardContent>
						</Card>
					</Grid>
				</Grid>

				<Divider sx={{ my: 4 }} />

				<Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
					<Button variant="outlined" onClick={handleReset}>
						Reset
					</Button>
					<Button
						variant="contained"
						onClick={handleSave}
						disabled={saving}
					>
						{saving ? 'Saving...' : 'Save'}
					</Button>
				</Box>
			</Paper>
		</Container>
	);
}

/**
 * Initialize options page with React providers
 * Sets up QueryClient, i18n, and Material-UI theme providers
 */
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<I18nextProvider i18n={i18n}>
				<ThemeProvider theme={theme}>
					<CssBaseline />
					<OptionsPage />
				</ThemeProvider>
			</I18nextProvider>
		</QueryClientProvider>
	</React.StrictMode>
); 