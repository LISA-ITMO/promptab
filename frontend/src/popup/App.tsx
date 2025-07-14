/**
 * Main App component for PrompTab Chrome Extension popup
 * Provides the complete user interface for prompt optimization, variable management,
 * template usage, and integration with external AI platforms (ChatGPT, Perplexity).
 */
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Typography, Box, TextField, Button, Paper, Alert, CircularProgress, Fade, Slide, Tabs, Tab, Divider, List, ListItem, ListItemText, ListItemButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Badge, FormControlLabel, Checkbox } from '@mui/material';
import { apiService } from '@services/api';
import { getStoredToken, setStoredToken, removeStoredToken, getRecentPrompts, addRecentPrompt, getUserVariables, addUserVariable, updateUserVariable, removeUserVariable, UserVariable } from '@utils/storage';
import { PromptTemplate, OptimizationResult, RecentPrompt } from '../types';
import { forwardRef } from 'react';
import { SlideProps } from '@mui/material/Slide';

// Wrapper for Slide with correct types for MUI Dialog
const Transition = forwardRef(function Transition(
	props: SlideProps,
	ref: React.Ref<unknown>
) {
	return <Slide direction="up" ref={ref} {...props} />;
});

// iOS-inspired theme with modern design
const theme = createTheme({
	palette: {
		mode: 'light',
		primary: {
			main: '#007AFF', // iOS Blue
			light: '#5AC8FA',
			dark: '#0051D0',
		},
		secondary: {
			main: '#FF3B30', // iOS Red
			light: '#FF6B6B',
			dark: '#D70015',
		},
		background: {
			default: '#F2F2F7', // iOS Background
			paper: '#FFFFFF',
		},
		text: {
			primary: '#1C1C1E',
			secondary: '#8E8E93',
		},
		success: {
			main: '#34C759', // iOS Green
		},
		warning: {
			main: '#FF9500', // iOS Orange
		},
		error: {
			main: '#FF3B30', // iOS Red
		},
	},
	typography: {
		fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
		h4: {
			fontWeight: 700,
			fontSize: '1.625rem',
			letterSpacing: '-0.02em',
			background: 'linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%)',
			WebkitBackgroundClip: 'text',
			WebkitTextFillColor: 'transparent',
		},
		h6: {
			fontWeight: 600,
			fontSize: '1.0625rem',
			letterSpacing: '-0.01em',
		},
		body1: {
			fontSize: '0.8438rem',
			lineHeight: 1.5,
		},
		body2: {
			fontSize: '0.7813rem',
			lineHeight: 1.4,
		},
		button: {
			textTransform: 'none',
			fontWeight: 600,
			fontSize: '0.8438rem',
		},
	},
	components: {
		MuiButton: {
			styleOverrides: {
				root: {
					borderRadius: 16,
					padding: '11px 22px',
					fontWeight: 600,
					fontSize: '0.8438rem',
					boxShadow: '0 2px 8px rgba(0, 122, 255, 0.15)',
					transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
					'&:hover': {
						transform: 'translateY(-2px)',
						boxShadow: '0 6px 20px rgba(0, 122, 255, 0.3)',
					},
					'&:active': {
						transform: 'translateY(0)',
					},
				},
				contained: {
					background: 'linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%)',
					color: 'white',
					'&:hover': {
						background: 'linear-gradient(135deg, #0051D0 0%, #007AFF 100%)',
					},
				},
				outlined: {
					borderColor: '#007AFF',
					color: '#007AFF',
					backgroundColor: 'rgba(0, 122, 255, 0.05)',
					'&:hover': {
						backgroundColor: 'rgba(0, 122, 255, 0.1)',
						borderColor: '#0051D0',
					},
				},
			},
		},
		MuiTextField: {
			styleOverrides: {
				root: {
					'& .MuiOutlinedInput-root': {
						borderRadius: 16,
						backgroundColor: 'rgba(255, 255, 255, 0.8)',
						backdropFilter: 'blur(20px)',
						transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
						'&:hover': {
							backgroundColor: 'rgba(255, 255, 255, 0.9)',
							transform: 'translateY(-1px)',
						},
						'&.Mui-focused': {
							backgroundColor: 'rgba(255, 255, 255, 1)',
							transform: 'translateY(-1px)',
							'& .MuiOutlinedInput-notchedOutline': {
								borderColor: '#007AFF',
								borderWidth: '2px',
							},
						},
					},
				},
			},
		},
		MuiPaper: {
			styleOverrides: {
				root: {
					borderRadius: 20,
					background: 'rgba(255, 255, 255, 0.95)',
					backdropFilter: 'blur(20px)',
					boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
					border: '1px solid rgba(255, 255, 255, 0.2)',
					transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
					'&:hover': {
						transform: 'translateY(-2px)',
						boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
					},
				},
			},
		},
		MuiCard: {
			styleOverrides: {
				root: {
					borderRadius: 20,
					background: 'rgba(255, 255, 255, 0.9)',
					backdropFilter: 'blur(20px)',
					boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
					border: '1px solid rgba(255, 255, 255, 0.3)',
				},
			},
		},
		MuiAlert: {
			styleOverrides: {
				root: {
					borderRadius: 16,
					backdropFilter: 'blur(20px)',
					'&.MuiAlert-standardError': {
						background: 'linear-gradient(135deg, rgba(255, 59, 48, 0.1) 0%, rgba(255, 59, 48, 0.05) 100%)',
						border: '1px solid rgba(255, 59, 48, 0.2)',
					},
				},
			},
		},
		MuiTabs: {
			styleOverrides: {
				root: {
					borderRadius: 16,
					backgroundColor: 'rgba(255, 255, 255, 0.8)',
					backdropFilter: 'blur(20px)',
					minHeight: 44,
					boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
				},
				indicator: {
					backgroundColor: '#007AFF',
					borderRadius: 8,
					height: 3,
				},
			},
		},
		MuiTab: {
			styleOverrides: {
				root: {
					borderRadius: 12,
					fontWeight: 600,
					fontSize: '0.875rem',
					minHeight: 44,
					textTransform: 'none',
					transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
					'&.Mui-selected': {
						color: '#007AFF',
						fontWeight: 700,
						transform: 'scale(1.05)',
					},
					'&:hover': {
						backgroundColor: 'rgba(0, 122, 255, 0.08)',
					},
				},
			},
		},
		MuiListItemButton: {
			styleOverrides: {
				root: {
					borderRadius: 12,
					marginBottom: 8,
					transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
					'&:hover:not(.Mui-disabled)': {
						backgroundColor: 'rgba(0, 122, 255, 0.08)',
						transform: 'translateX(4px)',
					},
					'&:active:not(.Mui-disabled)': {
						transform: 'translateX(2px)',
					},
					'&.Mui-disabled': {
						opacity: 0.5,
						pointerEvents: 'none',
					},
				},
			},
		},
		MuiChip: {
			styleOverrides: {
				root: {
					borderRadius: 8,
					fontSize: '0.75rem',
					fontWeight: 500,
					transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
					'&:hover': {
						transform: 'scale(1.05)',
					},
				},
			},
		},
		MuiDialog: {
			styleOverrides: {
				paper: {
					borderRadius: 24,
					background: 'rgba(255, 255, 255, 0.95)',
					backdropFilter: 'blur(20px)',
					boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
				},
			},
		},
		MuiIconButton: {
			styleOverrides: {
				root: {
					borderRadius: 12,
					transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
					'&:hover': {
						transform: 'scale(1.1)',
					},
				},
			},
		},
		MuiCircularProgress: {
			styleOverrides: {
				root: {
					'& .MuiCircularProgress-circle': {
						strokeLinecap: 'round',
					},
				},
			},
		},
	},
});

// Predefined prompt templates
const promptTemplates: PromptTemplate[] = [
	{
		id: 'blog-post',
		title: 'Blog Post Writer',
		description: 'Create engaging blog content',
		prompt: 'Write a comprehensive blog post about [TOPIC]. Make it engaging, informative, and SEO-friendly. Include:\n\n1. Catchy headline\n2. Introduction\n3. Main points with examples\n4. Conclusion\n5. Call to action\n\nTarget audience: [AUDIENCE]\nTone: [TONE]',
		category: 'Content Creation',
		variables: ['TOPIC', 'AUDIENCE', 'TONE'],
		icon: '📝',
	},
	{
		id: 'code-review',
		title: 'Code Reviewer',
		description: 'Review and improve code',
		prompt: 'Review this code and provide detailed feedback:\n\n[CODE]\n\nFocus on:\n- Code quality and best practices\n- Performance optimization\n- Security considerations\n- Readability and maintainability\n- Potential bugs or issues',
		category: 'Development',
		variables: ['CODE'],
		icon: '💻',
	},
	{
		id: 'meeting-summary',
		title: 'Meeting Summarizer',
		description: 'Summarize meeting notes',
		prompt: 'Summarize the following meeting notes into a clear, structured format:\n\n[MEETING_NOTES]\n\nInclude:\n- Key discussion points\n- Decisions made\n- Action items with owners\n- Next steps\n- Follow-up required',
		category: 'Business',
		variables: ['MEETING_NOTES'],
		icon: '📊',
	},
	{
		id: 'email-composer',
		title: 'Professional Email',
		description: 'Compose professional emails',
		prompt: 'Write a professional email with the following details:\n\nPurpose: [PURPOSE]\nRecipient: [RECIPIENT]\nKey points: [KEY_POINTS]\nTone: [TONE]\n\nMake it clear, concise, and action-oriented.',
		category: 'Communication',
		variables: ['PURPOSE', 'RECIPIENT', 'KEY_POINTS', 'TONE'],
		icon: '✉️',
	},
];

// Function to parse variables from text in square brackets
function parseVariablesFromText(text: string): Array<{ name: string; start: number; end: number }> {
	const variables: Array<{ name: string; start: number; end: number }> = [];
	const regex = /\[([^\]]+)\]/g;
	let match;

	while ((match = regex.exec(text)) !== null) {
		if (match[1]) {
			variables.push({
				name: match[1],
				start: match.index,
				end: match.index + match[0].length,
			});
		}
	}

	return variables;
}

// Component for rendering interactive text with clickable variables
function InteractiveText({
	text,
	onVariableClick
}: {
	text: string;
	onVariableClick: (variableName: string, start: number, end: number) => void;
}) {
	const variables = parseVariablesFromText(text);

	if (variables.length === 0) {
		return <span>{text}</span>;
	}

	const elements: React.ReactNode[] = [];
	let lastIndex = 0;

	variables.forEach((variable, index) => {
		// Add text before variable
		if (variable.start > lastIndex) {
			elements.push(
				<span key={`text-${index}`}>
					{text.substring(lastIndex, variable.start)}
				</span>
			);
		}

		// Add clickable variable
		elements.push(
			<Box
				key={`var-${index}`}
				component="span"
				onClick={() => onVariableClick(variable.name, variable.start, variable.end)}
				sx={{
					color: '#007AFF',
					backgroundColor: '#E3F2FD',
					padding: '2px 6px',
					borderRadius: '4px',
					cursor: 'pointer',
					fontWeight: 500,
					border: '1px solid #BBDEFB',
					'&:hover': {
						backgroundColor: '#BBDEFB',
						borderColor: '#007AFF',
					},
					transition: 'all 0.2s ease',
				}}
			>
				[{variable.name}]
			</Box>
		);

		lastIndex = variable.end;
	});

	// Add remaining text
	if (lastIndex < text.length) {
		elements.push(
			<span key="text-end">
				{text.substring(lastIndex)}
			</span>
		);
	}

	return <>{elements}</>;
}

function replaceVariables(prompt: string, variables: Record<string, string>): string {
	let result = prompt;
	for (const [key, value] of Object.entries(variables)) {
		result = result.replace(new RegExp(`\\[${key}\\]`, 'g'), value);
	}
	return result;
}

function App() {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
	const [currentView, setCurrentView] = useState<'auth' | 'optimize' | 'templates' | 'history' | 'variables'>('auth');

	// Login form
	const [loginData, setLoginData] = useState({
		username: '',
		password: '',
	});

	// Register form
	const [registerData, setRegisterData] = useState({
		email: '',
		username: '',
		password: '',
	});

	// Optimization form
	const [promptData, setPromptData] = useState({
		prompt: '',
		language: 'auto' as 'auto' | 'ru' | 'en',
		use_rag: true,
	});

	// Optimization result
	const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);

	// Recent prompts from local storage
	const [recentPrompts, setRecentPrompts] = useState<RecentPrompt[]>([]);

	// User variables
	const [userVariables, setUserVariables] = useState<UserVariable[]>([]);

	// New state for interactive variable replacement
	const [variableReplaceDialog, setVariableReplaceDialog] = useState({
		open: false,
		variableName: '',
		currentValue: '',
		position: { start: 0, end: 0 },
		useExisting: false,
		selectedVariable: undefined as UserVariable | undefined,
	});

	// Variable manager
	const [variableDialog, setVariableDialog] = useState<{
		open: boolean;
		template: PromptTemplate | null;
		variables: Record<string, string>;
	}>({
		open: false,
		template: null,
		variables: {},
	});

	// Variable creation dialog
	const [createVariableDialog, setCreateVariableDialog] = useState<{
		open: boolean;
		editingId?: string;
		name: string;
		value: string;
		description: string;
		category: string;
	}>({
		open: false,
		name: '',
		value: '',
		description: '',
		category: '',
	});

	// SAFE initialization check with protected state changes
	useEffect(() => {
		let mounted = true;

		const checkAuth = async () => {
			try {
				const token = await getStoredToken();
				const recent = await getRecentPrompts();
				const variables = await getUserVariables();

				if (mounted) {
					setIsAuthenticated(!!token);
					setIsLoading(false);
					setRecentPrompts(recent);
					setUserVariables(variables);
					// If authenticated, show optimization by default
					if (token) {
						setCurrentView('optimize');
					}
				}
			} catch (error) {
				console.error('Auth check error:', error);
				if (mounted) {
					setIsAuthenticated(false);
					setIsLoading(false);
				}
			}
		};

		checkAuth();

		return () => {
			mounted = false;
		};
	}, []); // Empty dependency array - run only once

	// Clear error after 5 seconds
	useEffect(() => {
		if (error) {
			const timer = setTimeout(() => {
				setError(null);
			}, 5000);
			return () => clearTimeout(timer);
		}
		return () => { }; // Always return cleanup function
	}, [error]);

	// SAFE login mutation with protected callbacks
	const loginMutation = useMutation({
		mutationFn: (data: { username: string; password: string }) => apiService.login(data),
		onSuccess: async (response) => {
			try {
				// Store token first
				await setStoredToken(response.access_token);

				// Clear form data
				setLoginData({ username: '', password: '' });

				// Set authentication state and switch to optimization - DELAYED to prevent cycles
				setTimeout(() => {
					setIsAuthenticated(true);
					setCurrentView('optimize');
				}, 100);
			} catch (error) {
				console.error('Login success handler error:', error);
				setError('Login successful but token storage failed');
			}
		},
		onError: (error: any) => {
			console.error('Login error:', error);
			setError(error.response?.data?.detail || 'Login failed');
		},
	});

	// SAFE register mutation with protected callbacks
	const registerMutation = useMutation({
		mutationFn: (data: { email: string; username: string; password: string }) => apiService.register(data),
		onSuccess: () => {
			// Clear form data
			setRegisterData({ email: '', username: '', password: '' });

			// Switch to login tab - DELAYED to prevent cycles
			setTimeout(() => {
				setActiveTab('login');
			}, 100);
		},
		onError: (error: any) => {
			console.error('Register error:', error);
			setError(error.response?.data?.detail || 'Registration failed');
		},
	});

	// SAFE optimization mutation with protected callbacks
	const optimizeMutation = useMutation({
		mutationFn: (data: { prompt: string; language: 'auto' | 'ru' | 'en'; use_rag: boolean }) => apiService.optimizePrompt(data),
		onSuccess: async (response) => {
			try {
				// Save to recent prompts
				await addRecentPrompt({
					original: response.original,
					optimized: response.optimized,
				});

				// Update recent prompts state
				const updated = await getRecentPrompts();
				setRecentPrompts(updated);

				// Set optimization result - DELAYED to prevent cycles
				setTimeout(() => {
					setOptimizationResult(response);
				}, 100);
			} catch (error) {
				console.error('Optimization success handler error:', error);
				// Still show result even if saving fails
				setTimeout(() => {
					setOptimizationResult(response);
				}, 100);
			}
		},
		onError: (error: any) => {
			console.error('Optimization error:', error);
			setError(error.response?.data?.detail || 'Optimization failed');
		},
	});

	const handleLogin = (e: React.FormEvent) => {
		e.preventDefault();
		if (loginMutation.isPending) return;

		setError(null);
		loginMutation.mutate(loginData);
	};

	const handleRegister = (e: React.FormEvent) => {
		e.preventDefault();
		if (registerMutation.isPending) return;

		setError(null);
		registerMutation.mutate(registerData);
	};

	const handleOptimize = (e: React.FormEvent) => {
		e.preventDefault();
		if (optimizeMutation.isPending) return;

		setError(null);
		setOptimizationResult(null);
		optimizeMutation.mutate(promptData);
	};

	const handleUseTemplate = (template: PromptTemplate) => {
		if (template.variables && template.variables.length > 0) {
			// Open variable dialog
			const initialVariables: Record<string, string> = {};
			template.variables.forEach((variable: string) => {
				initialVariables[variable] = '';
			});
			setVariableDialog({
				open: true,
				template,
				variables: initialVariables,
			});
		} else {
			// Use template directly
			setPromptData({ ...promptData, prompt: template.prompt });
			setCurrentView('optimize');
		}
	};

	const handleVariableChange = (variable: string, value: string) => {
		setVariableDialog(prev => ({
			...prev,
			variables: {
				...prev.variables,
				[variable]: value,
			},
		}));
	};

	const handleApplyTemplate = () => {
		if (variableDialog.template) {
			const filledPrompt = replaceVariables(
				variableDialog.template.prompt,
				variableDialog.variables
			);
			setPromptData({ ...promptData, prompt: filledPrompt });
			setVariableDialog({ open: false, template: null, variables: {} });
			setCurrentView('optimize');
		}
	};

	const handleCancelTemplate = () => {
		setVariableDialog({ open: false, template: null, variables: {} });
	};

	const handleUseHistoryItem = (item: RecentPrompt) => {
		setPromptData({ ...promptData, prompt: item.original });
		setCurrentView('optimize');
	};

	const handleLogout = async () => {
		try {
			await removeStoredToken();
			setIsAuthenticated(false);
			setCurrentView('auth');
			setLoginData({ username: '', password: '' });
			setOptimizationResult(null);
		} catch (error) {
			console.error('Logout error:', error);
		}
	};

	// Variable management functions
	const handleCreateVariable = () => {
		setCreateVariableDialog({
			open: true,
			name: '',
			value: '',
			description: '',
			category: '',
		});
	};

	const handleEditVariable = (variable: UserVariable) => {
		setCreateVariableDialog({
			open: true,
			editingId: variable.id,
			name: variable.name,
			value: variable.value,
			description: variable.description || '',
			category: variable.category || '',
		});
	};

	const handleSaveVariable = async () => {
		// Validation
		if (!createVariableDialog.name.trim()) {
			setError('Variable name is required');
			return;
		}
		if (!createVariableDialog.value.trim()) {
			setError('Variable value is required');
			return;
		}

		try {
			if (createVariableDialog.editingId) {
				// Update existing variable
				const variableToUpdate: UserVariable = {
					id: createVariableDialog.editingId,
					name: createVariableDialog.name,
					value: createVariableDialog.value,
					description: createVariableDialog.description,
					category: createVariableDialog.category,
					timestamp: Date.now(),
				};
				await updateUserVariable(variableToUpdate);
			} else {
				// Create new variable
				await addUserVariable({
					name: createVariableDialog.name,
					value: createVariableDialog.value,
					description: createVariableDialog.description,
					category: createVariableDialog.category,
				});
			}

			// Refresh variables
			const variables = await getUserVariables();
			setUserVariables(variables);

			// Close dialog
			setCreateVariableDialog({
				open: false,
				name: '',
				value: '',
				description: '',
				category: '',
			});
		} catch (error) {
			console.error('Variable save error:', error);
			setError('Failed to save variable');
		}
	};

	const handleDeleteVariable = async (id: string) => {
		try {
			await removeUserVariable(id);
			const variables = await getUserVariables();
			setUserVariables(variables);
		} catch (error) {
			console.error('Variable delete error:', error);
			setError('Failed to delete variable');
		}
	};

	const handleCancelVariableEdit = () => {
		setCreateVariableDialog({
			open: false,
			name: '',
			value: '',
			description: '',
			category: '',
		});
	};

	const handleInsertVariable = (variableName: string) => {
		if (optimizationResult) {
			const updatedPrompt = optimizationResult.optimized + ` [${variableName}]`;
			setOptimizationResult({
				...optimizationResult,
				optimized: updatedPrompt,
			});
		}
	};

	// Interactive variable handlers
	const handleVariableClick = (variableName: string, start: number, end: number) => {
		// Check if variable already exists
		const existingVariable = userVariables.find(v => v.name === variableName);

		setVariableReplaceDialog({
			open: true,
			variableName,
			currentValue: existingVariable?.value || '',
			position: { start, end },
			useExisting: false,
			selectedVariable: undefined,
		});
	};

	const handleReplaceVariable = async (useExisting: boolean, selectedVariable?: UserVariable) => {
		if (!optimizationResult) return;

		const { variableName, position } = variableReplaceDialog;
		let replacementValue = '';

		if (useExisting && selectedVariable) {
			replacementValue = selectedVariable.value;
		} else {
			// Create new variable
			const newVariable = await addUserVariable({
				name: variableName,
				value: variableReplaceDialog.currentValue,
				description: `Variable for ${variableName}`,
				category: 'general',
			});
			replacementValue = newVariable.value;

			// Refresh variables
			const variables = await getUserVariables();
			setUserVariables(variables);
		}

		// Replace variable in text
		const originalText = optimizationResult.optimized;
		const beforeVariable = originalText.substring(0, position.start);
		const afterVariable = originalText.substring(position.end);
		const updatedText = beforeVariable + replacementValue + afterVariable;

		setOptimizationResult({
			...optimizationResult,
			optimized: updatedText,
		});

		// Close dialog
		setVariableReplaceDialog({
			open: false,
			variableName: '',
			currentValue: '',
			position: { start: 0, end: 0 },
			useExisting: false,
			selectedVariable: undefined,
		});
	};

	const handleCancelVariableReplace = () => {
		setVariableReplaceDialog({
			open: false,
			variableName: '',
			currentValue: '',
			position: { start: 0, end: 0 },
			useExisting: false,
			selectedVariable: undefined,
		});
	};

	// Show loading with iOS-style spinner
	if (isLoading) {
		return (
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<Box sx={{
					width: 400,
					height: 580,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					background: 'linear-gradient(135deg, #F2F2F7 0%, #E5E5EA 100%)',
				}}>
					<Fade in={true}>
						<Box sx={{ textAlign: 'center' }}>
							<CircularProgress size={40} thickness={4} sx={{ color: '#007AFF', mb: 3 }} />
							<Typography variant="h6" sx={{ color: '#007AFF', mb: 1 }}>
								PrompTab
							</Typography>
							<Typography variant="body2" sx={{ color: '#8E8E93' }}>
								Loading your AI assistant...
							</Typography>
						</Box>
					</Fade>
				</Box>
			</ThemeProvider>
		);
	}

	const isSubmitting = loginMutation.isPending || registerMutation.isPending || optimizeMutation.isPending;

	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<Box sx={{
				width: 400,
				height: 580,
				background: 'linear-gradient(135deg, #F2F2F7 0%, #E5E5EA 100%)',
				overflow: 'hidden',
				display: 'flex',
				flexDirection: 'column',
			}}>
				{/* Header */}
				<Box sx={{ p: 2.75, pb: 1.75 }}>
					<Slide direction="down" in={true} mountOnEnter unmountOnExit timeout={600}>
						<Box sx={{ textAlign: 'center', mb: 2.25 }}>
							<Typography variant="h4" component="h1" gutterBottom>
								PrompTab
							</Typography>
							<Typography variant="body2" sx={{ color: '#8E8E93' }}>
								AI Prompt Optimization
							</Typography>
						</Box>
					</Slide>

					{/* Navigation Tabs */}
					{isAuthenticated && (
						<Fade in={true} timeout={800}>
							<Tabs
								value={currentView}
								onChange={(_, newValue) => setCurrentView(newValue)}
								variant="scrollable"
								scrollButtons="auto"
								sx={{ mb: 2 }}
							>
								<Tab
									label="🚀 Optimize"
									value="optimize"
									sx={{ '&.Mui-selected': { color: '#007AFF' } }}
								/>
								<Tab
									label={
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
											📝 Templates
											<Badge badgeContent={promptTemplates.length} color="primary" />
										</Box>
									}
									value="templates"
									sx={{ '&.Mui-selected': { color: '#007AFF' } }}
								/>
								<Tab
									label={
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
											📚 History
											{recentPrompts.length > 0 && (
												<Badge badgeContent={recentPrompts.length} color="primary" />
											)}
										</Box>
									}
									value="history"
									sx={{ '&.Mui-selected': { color: '#007AFF' } }}
								/>
								<Tab
									label={
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
											🔧 Variables
											{userVariables.length > 0 && (
												<Badge badgeContent={userVariables.length} color="primary" />
											)}
										</Box>
									}
									value="variables"
									sx={{ '&.Mui-selected': { color: '#007AFF' } }}
								/>
								<Tab
									label="👤 Account"
									value="auth"
									sx={{ '&.Mui-selected': { color: '#007AFF' } }}
								/>
							</Tabs>
						</Fade>
					)}

					{/* Error Alert */}
					{error && (
						<Fade in={true} timeout={400}>
							<Alert
								severity="error"
								sx={{
									mb: 2,
									fontWeight: 500,
								}}
							>
								{error}
							</Alert>
						</Fade>
					)}
				</Box>

				{/* Content */}
				<Box sx={{ flex: 1, overflow: 'auto', px: 2.75, pb: 2.75 }}>
					{/* Authentication View */}
					{(!isAuthenticated || currentView === 'auth') && (
						<Fade in={true} timeout={600}>
							<Paper sx={{ p: 3.25 }}>
								{isAuthenticated ? (
									// Authenticated account view
									<Box sx={{ textAlign: 'center' }}>
										<Typography variant="h6" gutterBottom sx={{ color: '#34C759' }}>
											✨ Welcome back!
										</Typography>
										<Typography variant="body1" sx={{ mb: 3, color: '#8E8E93' }}>
											You're successfully authenticated.
										</Typography>
										<Button variant="outlined" onClick={handleLogout}>
											Logout
										</Button>
									</Box>
								) : (
									// Login/Register forms
									<>
										{/* Tab buttons */}
										<Box sx={{ display: 'flex', mb: 3, gap: 1 }}>
											<Button
												onClick={() => setActiveTab('login')}
												variant={activeTab === 'login' ? 'contained' : 'outlined'}
												sx={{ flex: 1 }}
											>
												Login
											</Button>
											<Button
												onClick={() => setActiveTab('register')}
												variant={activeTab === 'register' ? 'contained' : 'outlined'}
												sx={{ flex: 1 }}
											>
												Register
											</Button>
										</Box>

										{/* Login Form */}
										{activeTab === 'login' && (
											<Slide direction="right" in={activeTab === 'login'} mountOnEnter unmountOnExit timeout={500}>
												<Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
													<TextField
														label="Username"
														value={loginData.username}
														onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
														required
														fullWidth
														disabled={isSubmitting}
														variant="outlined"
													/>
													<TextField
														label="Password"
														type="password"
														value={loginData.password}
														onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
														required
														fullWidth
														disabled={isSubmitting}
														variant="outlined"
													/>
													<Button
														type="submit"
														variant="contained"
														disabled={!loginData.username || !loginData.password || isSubmitting}
														fullWidth
														sx={{ mt: 1 }}
													>
														{isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Login'}
													</Button>
												</Box>
											</Slide>
										)}

										{/* Register Form */}
										{activeTab === 'register' && (
											<Slide direction="left" in={activeTab === 'register'} mountOnEnter unmountOnExit timeout={500}>
												<Box component="form" onSubmit={handleRegister} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
													<TextField
														label="Email"
														type="email"
														value={registerData.email}
														onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
														required
														fullWidth
														disabled={isSubmitting}
														variant="outlined"
													/>
													<TextField
														label="Username"
														value={registerData.username}
														onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
														required
														fullWidth
														disabled={isSubmitting}
														variant="outlined"
													/>
													<TextField
														label="Password"
														type="password"
														value={registerData.password}
														onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
														required
														fullWidth
														disabled={isSubmitting}
														variant="outlined"
													/>
													<Button
														type="submit"
														variant="contained"
														disabled={!registerData.email || !registerData.username || !registerData.password || isSubmitting}
														fullWidth
														sx={{ mt: 1 }}
													>
														{isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Register'}
													</Button>
												</Box>
											</Slide>
										)}
									</>
								)}
							</Paper>
						</Fade>
					)}

					{/* Optimization View */}
					{isAuthenticated && currentView === 'optimize' && (
						<Fade in={true} timeout={600}>
							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
								{/* Optimization Form */}
								<Paper sx={{ p: 3.25 }}>
									<Typography variant="h6" gutterBottom>
										🚀 Optimize Your Prompt
									</Typography>
									<Box component="form" onSubmit={handleOptimize} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
										<TextField
											label="Your Prompt"
											value={promptData.prompt}
											onChange={(e) => setPromptData({ ...promptData, prompt: e.target.value })}
											required
											fullWidth
											multiline
											rows={4}
											disabled={isSubmitting}
											variant="outlined"
											placeholder="Enter your prompt here..."
										/>
										<Button
											type="submit"
											variant="contained"
											disabled={!promptData.prompt.trim() || isSubmitting}
											fullWidth
											sx={{ mt: 1 }}
										>
											{isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Optimize Prompt'}
										</Button>
									</Box>
								</Paper>

								{/* Optimization Result */}
								{optimizationResult && (
									<Slide direction="up" in={true} mountOnEnter unmountOnExit timeout={600}>
										<Paper sx={{ p: 3.25 }}>
											<Typography variant="h6" gutterBottom sx={{ color: '#34C759' }}>
												✨ Optimized Result
											</Typography>
											<Divider sx={{ mb: 2 }} />
											<Typography variant="body2" sx={{ color: '#8E8E93', mb: 1 }}>
												Original:
											</Typography>
											<Typography variant="body1" sx={{ mb: 3, p: 2, bgcolor: 'rgba(0, 0, 0, 0.05)', borderRadius: 2 }}>
												{optimizationResult.original}
											</Typography>
											<Typography variant="body2" sx={{ color: '#8E8E93', mb: 1 }}>
												Optimized:
											</Typography>
											{parseVariablesFromText(optimizationResult.optimized).length > 0 && (
												<Alert severity="info" sx={{ mb: 2, fontSize: '0.8rem' }}>
													💡 Click on variables in [brackets] to replace with your data
												</Alert>
											)}
											<Typography variant="body1" sx={{ mb: 2, p: 2, bgcolor: 'rgba(0, 122, 255, 0.05)', borderRadius: 2 }}>
												<InteractiveText
													text={optimizationResult.optimized}
													onVariableClick={handleVariableClick}
												/>
											</Typography>
											{userVariables.length > 0 && (
												<Box sx={{ mb: 2 }}>
													<Typography variant="body2" sx={{ color: '#8E8E93', mb: 1 }}>
														Insert Variables:
													</Typography>
													<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
														{userVariables.map((variable) => (
															<Button
																key={variable.id}
																size="small"
																variant="outlined"
																onClick={() => handleInsertVariable(variable.name)}
																sx={{ fontSize: '0.7rem', py: 0.25, px: 1 }}
															>
																{variable.name}
															</Button>
														))}
													</Box>
												</Box>
											)}
											{optimizationResult.techniques_used && optimizationResult.techniques_used.length > 0 && (
												<Typography variant="body2" sx={{ color: '#8E8E93' }}>
													Techniques: {optimizationResult.techniques_used.join(', ')}
												</Typography>
											)}
										</Paper>
									</Slide>
								)}
							</Box>
						</Fade>
					)}

					{/* Templates View */}
					{isAuthenticated && currentView === 'templates' && (
						<Fade in={true} timeout={600}>
							<Paper sx={{ p: 3.25 }}>
								<Typography variant="h6" gutterBottom>
									📝 Prompt Templates
								</Typography>
								<Typography variant="body2" sx={{ color: '#8E8E93', mb: 3 }}>
									Choose from pre-made templates to get started quickly
								</Typography>
								<List>
									{promptTemplates.map((template, index) => (
										<Slide direction="right" in={true} mountOnEnter unmountOnExit timeout={300 + index * 100} key={template.id}>
											<ListItem disablePadding>
												<ListItemButton
													onClick={() => handleUseTemplate(template)}
													disabled={variableDialog.open}
												>
													<ListItemText
														primary={
															<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
																<Typography variant="body1" sx={{ fontSize: '1.2rem' }}>
																	{template.icon}
																</Typography>
																<Typography variant="body1" sx={{ fontWeight: 600 }}>
																	{template.title}
																</Typography>
															</Box>
														}
														secondary={
															<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
																<Typography variant="body2" sx={{ color: '#8E8E93' }}>
																	{template.description}
																</Typography>
																<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
																	<Chip
																		label={template.category}
																		size="small"
																		sx={{ alignSelf: 'flex-start' }}
																	/>
																	{template.variables && template.variables.length > 0 && (
																		<Chip
																			label={`${template.variables.length} variables`}
																			size="small"
																			variant="outlined"
																			sx={{ alignSelf: 'flex-start' }}
																		/>
																	)}
																</Box>
															</Box>
														}
													/>
												</ListItemButton>
											</ListItem>
										</Slide>
									))}
								</List>
							</Paper>
						</Fade>
					)}

					{/* History View */}
					{isAuthenticated && currentView === 'history' && (
						<Fade in={true} timeout={600}>
							<Paper sx={{ p: 3.25 }}>
								<Typography variant="h6" gutterBottom>
									📚 Recent Prompts
								</Typography>
								<Typography variant="body2" sx={{ color: '#8E8E93', mb: 3 }}>
									Your recent optimization history
								</Typography>
								{recentPrompts.length === 0 ? (
									<Typography variant="body2" sx={{ color: '#8E8E93', textAlign: 'center', py: 4 }}>
										No recent prompts yet. Start optimizing to see your history!
									</Typography>
								) : (
									<List>
										{recentPrompts.map((item, index) => (
											<Slide direction="left" in={true} mountOnEnter unmountOnExit timeout={300 + index * 100} key={item.id}>
												<ListItem disablePadding>
													<ListItemButton
														onClick={() => handleUseHistoryItem(item)}
														disabled={variableDialog.open}
													>
														<ListItemText
															primary={
																<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
																	<Typography variant="body1" sx={{ fontSize: '1rem' }}>
																		📝
																	</Typography>
																	<Typography variant="body1" sx={{ fontWeight: 500 }}>
																		{item.original.substring(0, 50) + (item.original.length > 50 ? '...' : '')}
																	</Typography>
																</Box>
															}
															secondary={
																<Typography variant="body2" sx={{ color: '#8E8E93', mt: 1 }}>
																	{new Date(item.timestamp).toLocaleDateString()}
																</Typography>
															}
														/>
													</ListItemButton>
												</ListItem>
											</Slide>
										))}
									</List>
								)}
							</Paper>
						</Fade>
					)}

					{/* Variables View */}
					{isAuthenticated && currentView === 'variables' && (
						<Fade in={true} timeout={600}>
							<Paper sx={{ p: 3.25 }}>
								<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
									<Box>
										<Typography variant="h6" gutterBottom>
											🔧 Variables
										</Typography>
										<Typography variant="body2" sx={{ color: '#8E8E93' }}>
											Create and manage your custom variables
										</Typography>
									</Box>
									<Button
										variant="contained"
										onClick={handleCreateVariable}
										size="small"
										sx={{ minWidth: 'auto', px: 2 }}
									>
										+ Add
									</Button>
								</Box>

								{userVariables.length === 0 ? (
									<Typography variant="body2" sx={{ color: '#8E8E93', textAlign: 'center', py: 4 }}>
										No variables yet. Create your first variable to get started!
									</Typography>
								) : (
									<List>
										{userVariables.map((variable, index) => (
											<Slide direction="right" in={true} mountOnEnter unmountOnExit timeout={300 + index * 100} key={variable.id}>
												<ListItem disablePadding>
													<ListItemButton
														onClick={() => handleEditVariable(variable)}
														disabled={variableDialog.open || createVariableDialog.open}
													>
														<ListItemText
															primary={
																<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
																	<Typography variant="body1" sx={{ fontSize: '1rem' }}>
																		🔧
																	</Typography>
																	<Typography variant="body1" sx={{ fontWeight: 600 }}>
																		{variable.name}
																	</Typography>
																</Box>
															}
															secondary={
																<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
																	<Typography variant="body2" sx={{ color: '#8E8E93' }}>
																		Value: {variable.value.substring(0, 50) + (variable.value.length > 50 ? '...' : '')}
																	</Typography>
																	{variable.description && (
																		<Typography variant="body2" sx={{ color: '#8E8E93', fontSize: '0.75rem' }}>
																			{variable.description}
																		</Typography>
																	)}
																	<Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
																		{variable.category && (
																			<Chip
																				label={variable.category}
																				size="small"
																				sx={{ alignSelf: 'flex-start' }}
																			/>
																		)}
																		{optimizationResult && (
																			<Button
																				size="small"
																				variant="outlined"
																				onClick={(e) => {
																					e.stopPropagation();
																					handleInsertVariable(variable.name);
																				}}
																				sx={{ fontSize: '0.7rem', py: 0.25, px: 1 }}
																			>
																				Insert
																			</Button>
																		)}
																		<Button
																			size="small"
																			color="error"
																			onClick={(e) => {
																				e.stopPropagation();
																				handleDeleteVariable(variable.id);
																			}}
																			sx={{ fontSize: '0.7rem', py: 0.25, px: 1 }}
																		>
																			Delete
																		</Button>
																	</Box>
																</Box>
															}
														/>
													</ListItemButton>
												</ListItem>
											</Slide>
										))}
									</List>
								)}
							</Paper>
						</Fade>
					)}
				</Box>

				{/* Variable Manager Dialog */}
				<Dialog
					open={variableDialog.open}
					onClose={handleCancelTemplate}
					maxWidth="sm"
					fullWidth
					TransitionComponent={Transition}
					disableRestoreFocus
					disableEnforceFocus
				>
					<DialogTitle>
						<Typography variant="h6">
							🔧 Configure Template Variables
						</Typography>
						<Typography variant="body2" sx={{ color: '#8E8E93', mt: 1 }}>
							{variableDialog.template?.title}
						</Typography>
					</DialogTitle>
					<DialogContent>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
							{variableDialog.template?.variables?.map((variable: string, index: number) => (
								<Slide direction="right" in={true} mountOnEnter unmountOnExit timeout={300 + index * 100} key={variable}>
									<TextField
										label={variable}
										value={variableDialog.variables[variable] || ''}
										onChange={(e) => handleVariableChange(variable, e.target.value)}
										fullWidth
										variant="outlined"
										placeholder={`Enter value for ${variable}`}
									/>
								</Slide>
							))}
						</Box>
					</DialogContent>
					<DialogActions>
						<Button onClick={handleCancelTemplate} variant="outlined">
							Cancel
						</Button>
						<Button
							onClick={handleApplyTemplate}
							variant="contained"
							disabled={Object.values(variableDialog.variables).some(v => !v.trim())}
						>
							Apply Template
						</Button>
					</DialogActions>
				</Dialog>

				{/* Variable Creation/Edit Dialog */}
				<Dialog
					open={createVariableDialog.open}
					onClose={handleCancelVariableEdit}
					maxWidth="sm"
					fullWidth
					TransitionComponent={Transition}
					disableRestoreFocus
					disableEnforceFocus
				>
					<DialogTitle>
						<Typography variant="h6">
							{createVariableDialog.editingId ? '✏️ Edit Variable' : '🆕 Create Variable'}
						</Typography>
						<Typography variant="body2" sx={{ color: '#8E8E93', mt: 1 }}>
							{createVariableDialog.editingId ? 'Update your variable' : 'Create a new custom variable'}
						</Typography>
					</DialogTitle>
					<DialogContent>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
							<TextField
								label="Variable Name"
								value={createVariableDialog.name}
								onChange={(e) => setCreateVariableDialog(prev => ({ ...prev, name: e.target.value }))}
								fullWidth
								variant="outlined"
								placeholder="e.g., COMPANY_NAME"
								required
							/>
							<TextField
								label="Variable Value"
								value={createVariableDialog.value}
								onChange={(e) => setCreateVariableDialog(prev => ({ ...prev, value: e.target.value }))}
								fullWidth
								variant="outlined"
								multiline
								rows={3}
								placeholder="e.g., Acme Corporation"
								required
							/>
							<TextField
								label="Description (optional)"
								value={createVariableDialog.description}
								onChange={(e) => setCreateVariableDialog(prev => ({ ...prev, description: e.target.value }))}
								fullWidth
								variant="outlined"
								placeholder="e.g., Company name for formal documents"
							/>
							<TextField
								label="Category (optional)"
								value={createVariableDialog.category}
								onChange={(e) => setCreateVariableDialog(prev => ({ ...prev, category: e.target.value }))}
								fullWidth
								variant="outlined"
								placeholder="e.g., Business, Personal, Technical"
							/>
						</Box>
					</DialogContent>
					<DialogActions>
						<Button onClick={handleCancelVariableEdit} variant="outlined">
							Cancel
						</Button>
						<Button
							onClick={handleSaveVariable}
							variant="contained"
							disabled={!createVariableDialog.name.trim() || !createVariableDialog.value.trim()}
						>
							{createVariableDialog.editingId ? 'Update' : 'Create'}
						</Button>
					</DialogActions>
				</Dialog>

				{/* Variable Replace Dialog */}
				<Dialog
					open={variableReplaceDialog.open}
					onClose={handleCancelVariableReplace}
					maxWidth="sm"
					fullWidth
					TransitionComponent={Transition}
					disableRestoreFocus
					disableEnforceFocus
				>
					<DialogTitle>
						<Typography variant="h6">
							🔄 Replace Variable
						</Typography>
						<Typography variant="body2" sx={{ color: '#8E8E93', mt: 1 }}>
							Replace the variable `[{variableReplaceDialog.variableName}]` with:
						</Typography>
					</DialogTitle>
					<DialogContent>
						<TextField
							label="New Value"
							value={variableReplaceDialog.currentValue}
							onChange={(e) => setVariableReplaceDialog(prev => ({ ...prev, currentValue: e.target.value }))}
							fullWidth
							multiline
							rows={3}
							placeholder="e.g., Acme Corporation"
							variant="outlined"
						/>
						<FormControlLabel
							control={
								<Checkbox
									checked={variableReplaceDialog.useExisting}
									onChange={(e) => setVariableReplaceDialog(prev => ({ ...prev, useExisting: e.target.checked }))}
									sx={{ mt: 2 }}
								/>
							}
							label="Use existing variable"
						/>
						{variableReplaceDialog.useExisting && (
							<Box sx={{ mt: 2 }}>
								<Typography variant="body2" sx={{ color: '#8E8E93', mb: 1 }}>
									Existing Variables:
								</Typography>
								<List dense>
									{userVariables.map((variable) => (
										<ListItem
											key={variable.id}
											button
											onClick={() => setVariableReplaceDialog(prev => ({ ...prev, selectedVariable: variable, currentValue: variable.value }))}
											sx={{
												borderRadius: 1,
												mb: 0.5,
												backgroundColor: variableReplaceDialog.selectedVariable?.id === variable.id ? 'rgba(0, 122, 255, 0.08)' : 'transparent',
												border: variableReplaceDialog.selectedVariable?.id === variable.id ? '1px solid #007AFF' : '1px solid transparent',
												'&:hover': {
													backgroundColor: 'rgba(0, 0, 0, 0.05)',
												},
											}}
										>
											<ListItemText
												primary={
													<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
														<Typography variant="body2" sx={{ fontWeight: 600 }}>
															{variable.name}
														</Typography>
													</Box>
												}
												secondary={
													<Typography variant="body2" sx={{ color: '#8E8E93' }}>
														Value: {variable.value.substring(0, 50) + (variable.value.length > 50 ? '...' : '')}
													</Typography>
												}
											/>
										</ListItem>
									))}
								</List>
							</Box>
						)}
					</DialogContent>
					<DialogActions>
						<Button onClick={handleCancelVariableReplace} variant="outlined">
							Cancel
						</Button>
						<Button
							onClick={() => handleReplaceVariable(variableReplaceDialog.useExisting, variableReplaceDialog.selectedVariable)}
							variant="contained"
							disabled={!variableReplaceDialog.currentValue.trim() || (variableReplaceDialog.useExisting && !variableReplaceDialog.selectedVariable)}
						>
							{variableReplaceDialog.useExisting ? 'Replace' : 'Create New'}
						</Button>
					</DialogActions>
				</Dialog>
			</Box>
		</ThemeProvider>
	);
}

export default App; 