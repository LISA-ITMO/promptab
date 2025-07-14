/**
 * Authentication panel component for PrompTab
 * Provides login and registration functionality with form validation and error handling
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import {
	Box,
	TextField,
	Button,
	Paper,
	Typography,
	Tabs,
	Tab,
	CircularProgress,

	Divider,
	IconButton,
} from '@mui/material';
import {
	Visibility,
	VisibilityOff,
	Login as LoginIcon,
	PersonAdd as RegisterIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { apiService } from '@services/api';
import { setStoredToken } from '@utils/storage';

/**
 * Props for the AuthPanel component
 */
interface AuthPanelProps {
	/** Callback function called when login is successful */
	onLogin: () => void;
	/** Optional callback for error handling */
	onError?: (error: string) => void;
}

/**
 * Props for the TabPanel component
 */
interface TabPanelProps {
	/** Child components to render */
	children?: React.ReactNode;
	/** Tab index this panel represents */
	index: number;
	/** Currently selected tab value */
	value: number;
}

/**
 * Tab panel component for organizing login and register forms
 * @param props - TabPanel properties
 * @returns Tab panel element
 */
function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;
	return (
		<div role="tabpanel" hidden={value !== index} {...other}>
			{value === index && <Box sx={{ p: 2 }}>{children}</Box>}
		</div>
	);
}

/**
 * Authentication panel component with login and registration forms
 * Handles user authentication with proper error handling and state management
 * @param props - AuthPanel properties
 * @returns Authentication panel JSX element
 */
export function AuthPanel({ onLogin, onError }: AuthPanelProps) {
	const { t } = useTranslation();
	const [tabValue, setTabValue] = useState(0);
	const [showPassword, setShowPassword] = useState(false);

	// Prevent multiple rapid onLogin calls
	const [isLoginCallbackInProgress, setIsLoginCallbackInProgress] = useState(false);

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
		confirmPassword: '',
	});

	/**
	 * Safe translation function with fallback handling
	 * @param key - Translation key
	 * @param fallback - Fallback text if translation fails
	 * @returns Translated text or fallback
	 */
	const safeTranslate = (key: string, fallback?: string) => {
		try {
			return t(key) || fallback || key;
		} catch (error) {
			console.error('Translation error for key:', key, error);
			return fallback || key;
		}
	};

	/**
	 * Debounced onLogin callback to prevent multiple rapid calls
	 * Implements protection against React #185 issue
	 */
	const handleLoginCallback = () => {
		if (isLoginCallbackInProgress) {
			console.debug('Login callback already in progress, skipping');
			return;
		}

		try {
			setIsLoginCallbackInProgress(true);
			console.debug('Executing onLogin callback');
			onLogin();

			// Keep the flag for a short time to prevent rapid multiple calls
			setTimeout(() => {
				setIsLoginCallbackInProgress(false);
			}, 1000);
		} catch (error) {
			console.debug('Login callback error:', error);
			setIsLoginCallbackInProgress(false);
		}
	};

	/**
	 * Login mutation with simplified error handling to prevent React #185
	 * Handles token storage and success/error callbacks
	 */
	const loginMutation = useMutation({
		mutationFn: (data: { username: string; password: string }) =>
			apiService.login(data),
		onSuccess: async (response) => {
			try {
				// Store token first
				await setStoredToken(response.access_token);

				// SINGLE delayed callback to prevent React #185 cycles
				setTimeout(() => {
					try {
						handleLoginCallback();
					} catch (callbackError) {
						console.debug('Login callback error (expected):', callbackError);
						setIsLoginCallbackInProgress(false);
					}
				}, 200);

				// Delayed success message to prevent render cycles
				setTimeout(() => {
					try {
						toast.success(safeTranslate('login_success', 'Login successful'));
					} catch (toastError) {
						console.debug('Toast error (non-critical):', toastError);
					}
				}, 400);

			} catch (error) {
				console.debug('Login success handler error (expected):', error);
				setIsLoginCallbackInProgress(false);
				// Delayed error to prevent cycles
				setTimeout(() => {
					if (onError) {
						onError('Login successful but token storage failed');
					} else {
						toast.error('Login successful but token storage failed');
					}
				}, 100);
			}
		},
		onError: (error: any) => {
			try {
				// SINGLE setState to prevent React #185
				setIsLoginCallbackInProgress(false);

				const errorMessage = error.response?.data?.detail || error.message || safeTranslate('login_error', 'Login error');

				// Delayed error handling to prevent cycles
				setTimeout(() => {
					if (onError) {
						onError(errorMessage);
					} else {
						toast.error(errorMessage);
					}
				}, 100);

			} catch (handlerError) {
				console.debug('Login error handler error (expected):', handlerError);
				setIsLoginCallbackInProgress(false);
				setTimeout(() => {
					if (onError) {
						onError('Login failed');
					} else {
						toast.error('Login failed');
					}
				}, 100);
			}
		},
	});

	/**
	 * Registration mutation with simplified error handling
	 * Handles user registration and form state management
	 */
	const registerMutation = useMutation({
		mutationFn: (data: { email: string; username: string; password: string }) =>
			apiService.register(data),
		onSuccess: () => {
			try {
				// SINGLE setState to prevent React #185
				setTabValue(0); // Switch to login tab

				// Delayed success message
				setTimeout(() => {
					try {
						toast.success(safeTranslate('register_success', 'Registration successful'));
					} catch (toastError) {
						console.debug('Toast error (non-critical):', toastError);
					}
				}, 200);
			} catch (error) {
				console.error('Register success handler error:', error);
			}
		},
		onError: (error: any) => {
			try {
				const errorMessage = error.response?.data?.detail || error.message || safeTranslate('register_error', 'Registration error');

				// Delayed error to prevent cycles
				setTimeout(() => {
					if (onError) {
						onError(errorMessage);
					} else {
						toast.error(errorMessage);
					}
				}, 100);

			} catch (handlerError) {
				console.error('Register error handler error:', handlerError);
				setTimeout(() => {
					if (onError) {
						onError('Registration failed');
					} else {
						toast.error('Registration failed');
					}
				}, 100);
			}
		},
	});

	/**
	 * Handle login form submission
	 * Validates form data and triggers login mutation
	 * @param e - Form submission event
	 */
	const handleLogin = (e: React.FormEvent) => {
		try {
			e.preventDefault();
			if (!loginData.username || !loginData.password) {
				const errorMessage = safeTranslate('fill_required_fields', 'Fill required fields');
				if (onError) {
					onError(errorMessage);
				} else {
					toast.error(errorMessage);
				}
				return;
			}
			loginMutation.mutate(loginData);
		} catch (error) {
			console.error('Login handler error:', error);
			if (onError) {
				onError('Login form error');
			} else {
				toast.error('Login form error');
			}
		}
	};

	/**
	 * Handle registration form submission
	 * Validates form data and triggers registration mutation
	 * @param e - Form submission event
	 */
	const handleRegister = (e: React.FormEvent) => {
		try {
			e.preventDefault();
			if (!registerData.email || !registerData.username || !registerData.password) {
				const errorMessage = safeTranslate('fill_required_fields', 'Fill required fields');
				if (onError) {
					onError(errorMessage);
				} else {
					toast.error(errorMessage);
				}
				return;
			}
			if (registerData.password !== registerData.confirmPassword) {
				const errorMessage = safeTranslate('passwords_dont_match', 'Passwords don\'t match');
				if (onError) {
					onError(errorMessage);
				} else {
					toast.error(errorMessage);
				}
				return;
			}
			registerMutation.mutate({
				email: registerData.email,
				username: registerData.username,
				password: registerData.password,
			});
		} catch (error) {
			console.error('Register handler error:', error);
			if (onError) {
				onError('Registration form error');
			} else {
				toast.error('Registration form error');
			}
		}
	};

	/**
	 * Handle tab change between login and register forms
	 * @param _event - Tab change event (unused)
	 * @param newValue - New tab index
	 */
	const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
		try {
			setTabValue(newValue);
		} catch (error) {
			console.error('Tab change error:', error);
		}
	};

	return (
		<Box sx={{ width: 400, minHeight: 500 }}>
			<Paper elevation={0} sx={{ borderRadius: 0 }}>
				<Box sx={{ p: 3, textAlign: 'center' }}>
					<Typography variant="h5" component="h1" gutterBottom>
						PrompTab
					</Typography>
					<Typography variant="body2" color="text.secondary">
						{safeTranslate('auth_subtitle', 'Intelligent prompt optimization')}
					</Typography>
				</Box>

				<Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
					<Tab label={safeTranslate('login', 'Login')} />
					<Tab label={safeTranslate('register', 'Register')} />
				</Tabs>
			</Paper>

			<TabPanel value={tabValue} index={0}>
				<Box component="form" onSubmit={handleLogin} sx={{ p: 2 }}>
					<TextField
						fullWidth
						label={safeTranslate('username', 'Username')}
						value={loginData.username}
						onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
						margin="normal"
						disabled={loginMutation.isPending}
						autoComplete="username"
					/>
					<TextField
						fullWidth
						label={safeTranslate('password', 'Password')}
						type={showPassword ? 'text' : 'password'}
						value={loginData.password}
						onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
						margin="normal"
						disabled={loginMutation.isPending}
						autoComplete="current-password"
						InputProps={{
							endAdornment: (
								<IconButton
									onClick={() => setShowPassword(!showPassword)}
									edge="end"
								>
									{showPassword ? <VisibilityOff /> : <Visibility />}
								</IconButton>
							),
						}}
					/>
					<Button
						type="submit"
						fullWidth
						variant="contained"
						disabled={loginMutation.isPending}
						startIcon={loginMutation.isPending ? <CircularProgress size={20} /> : <LoginIcon />}
						sx={{ mt: 3, mb: 2 }}
					>
						{loginMutation.isPending ? safeTranslate('logging_in', 'Logging in...') : safeTranslate('login', 'Login')}
					</Button>
				</Box>
			</TabPanel>

			<TabPanel value={tabValue} index={1}>
				<Box component="form" onSubmit={handleRegister} sx={{ p: 2 }}>
					<TextField
						fullWidth
						label={safeTranslate('email', 'Email')}
						type="email"
						value={registerData.email}
						onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
						margin="normal"
						disabled={registerMutation.isPending}
						autoComplete="email"
					/>
					<TextField
						fullWidth
						label={safeTranslate('username', 'Username')}
						value={registerData.username}
						onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
						margin="normal"
						disabled={registerMutation.isPending}
						autoComplete="username"
					/>
					<TextField
						fullWidth
						label={safeTranslate('password', 'Password')}
						type={showPassword ? 'text' : 'password'}
						value={registerData.password}
						onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
						margin="normal"
						disabled={registerMutation.isPending}
						autoComplete="new-password"
					/>
					<TextField
						fullWidth
						label={safeTranslate('confirm_password', 'Confirm password')}
						type={showPassword ? 'text' : 'password'}
						value={registerData.confirmPassword}
						onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
						margin="normal"
						disabled={registerMutation.isPending}
						autoComplete="new-password"
					/>
					<Button
						type="submit"
						fullWidth
						variant="contained"
						disabled={registerMutation.isPending}
						startIcon={registerMutation.isPending ? <CircularProgress size={20} /> : <RegisterIcon />}
						sx={{ mt: 3, mb: 2 }}
					>
						{registerMutation.isPending ? safeTranslate('logging_in', 'Processing...') : safeTranslate('register', 'Register')}
					</Button>
				</Box>
			</TabPanel>

			<Divider />
			<Box sx={{ p: 2, textAlign: 'center' }}>
				<Typography variant="body2" color="text.secondary">
					{safeTranslate('auth_footer', '© 2023 PrompTab. All rights reserved.')}
				</Typography>
			</Box>
		</Box>
	);
} 