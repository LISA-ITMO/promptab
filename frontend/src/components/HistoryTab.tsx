/**
 * History Tab component for PrompTab
 * Displays a comprehensive history of recent and saved prompts with search functionality.
 * Supports prompt restoration, copying, and sending to external services (ChatGPT, Perplexity).
 */
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
	Box,
	Typography,
	List,
	ListItem,
	TextField,
	InputAdornment,
	Paper,
	IconButton,
	Chip,
	Menu,
	MenuItem,
	Tooltip,
	Skeleton,
} from '@mui/material';
import {
	Search as SearchIcon,
	History as HistoryIcon,
	MoreVert as MoreVertIcon,
	ContentCopy as CopyIcon,
	Restore as RestoreIcon,
	Share as ShareIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { apiService } from '@services/api';
import { RecentPrompt, ApiHistoryItem, HistoryPrompt } from '../types';
import browser from 'webextension-polyfill';

/**
 * Props for the HistoryTab component
 */
interface HistoryTabProps {
	/** Callback function to copy text to clipboard */
	onCopy: (text: string) => void;
	/** Callback function to send prompt to ChatGPT */
	onSendToChatGPT: (prompt: string) => void;
	/** Callback function to send prompt to Perplexity */
	onSendToPerplexity: (prompt: string) => void;
	/** Callback function to restore a prompt to the input field */
	onRestore: (prompt: string) => void;
}

/**
 * HistoryTab component displays a list of recent and saved prompts
 * with search functionality and various actions (copy, send, restore)
 */
export function HistoryTab({
	onCopy,
	onSendToChatGPT,
	onSendToPerplexity,
	onRestore,
}: HistoryTabProps) {
	const { t } = useTranslation();
	const [searchTerm, setSearchTerm] = useState('');
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [selectedPrompt, setSelectedPrompt] = useState<HistoryPrompt | null>(null);
	const [recentPrompts, setRecentPrompts] = useState<RecentPrompt[]>([]);

	// Get history from API
	const { data: apiHistory = [], isLoading } = useQuery({
		queryKey: ['prompt-history'],
		queryFn: () => apiService.getHistory({ limit: 50 }),
	});

	// FIXED: Get recent prompts from local storage - prevent React #185 cycles
	useEffect(() => {
		let isMounted = true; // Prevent state updates on unmounted component

		const loadRecentPrompts = async () => {
			try {
				const response = await browser.runtime.sendMessage({
					action: 'get-recent-prompts',
				});

				// Only update if component is still mounted and data is different
				if (isMounted && response?.prompts) {
					const newPrompts = response.prompts;

					// Prevent unnecessary updates by checking if data actually changed
					if (JSON.stringify(newPrompts) !== JSON.stringify(recentPrompts)) {
						setRecentPrompts(newPrompts);
					}
				}
			} catch (error) {
				console.error('Failed to load recent prompts:', error);
			}
		};

		loadRecentPrompts();

		// Cleanup function to prevent memory leaks
		return () => {
			isMounted = false;
		};
	}, []); // Empty dependency array - only run once on mount

	// Combine local and API history
	const allPrompts: HistoryPrompt[] = [
		...recentPrompts.map(p => ({
			...p,
			source: 'local' as const,
			created_at: new Date(p.timestamp).toISOString(),
		})),
		...apiHistory.map((p: ApiHistoryItem) => ({
			id: p.id,
			original: p.original_prompt,
			optimized: p.optimized_prompt,
			timestamp: new Date(p.created_at).getTime(),
			source: 'api' as const,
			created_at: p.created_at,
		})),
	];

	const filteredPrompts = allPrompts
		.filter(prompt =>
			!searchTerm ||
			prompt.original.toLowerCase().includes(searchTerm.toLowerCase()) ||
			prompt.optimized.toLowerCase().includes(searchTerm.toLowerCase())
		)
		.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
		.slice(0, 20);

	/**
	 * Opens the context menu for a prompt
	 * @param event - Mouse event that triggered the menu
	 * @param prompt - The prompt to show menu for
	 */
	const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, prompt: HistoryPrompt) => {
		setAnchorEl(event.currentTarget);
		setSelectedPrompt(prompt);
	};

	/**
	 * Closes the context menu
	 */
	const handleMenuClose = () => {
		setAnchorEl(null);
		setSelectedPrompt(null);
	};

	/**
	 * Restores the selected prompt to the input field
	 */
	const handleRestore = () => {
		if (selectedPrompt) {
			onRestore(selectedPrompt.original);
			toast.success(t('prompt_restored'));
		}
		handleMenuClose();
	};

	/**
	 * Formats a date string into a human-readable format
	 * @param dateString - ISO date string to format
	 * @returns Formatted date string
	 */
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

		if (diffHours < 1) {
			return t('just_now');
		} else if (diffHours < 24) {
			return t('hours_ago', { count: Math.floor(diffHours) });
		} else {
			return format(date, 'dd MMM, HH:mm', { locale: ru });
		}
	};

	if (isLoading && recentPrompts.length === 0) {
		return (
			<Box sx={{ p: 2 }}>
				{[...Array(5)].map((_, index) => (
					<Paper key={index} sx={{ p: 2, mb: 1 }}>
						<Skeleton variant="text" width="100%" height={20} />
						<Skeleton variant="text" width="80%" height={16} />
						<Skeleton variant="text" width="60%" height={14} />
					</Paper>
				))}
			</Box>
		);
	}

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
			{/* Search */}
			<Box sx={{ p: 2, pb: 1 }}>
				<TextField
					fullWidth
					size="small"
					placeholder={t('search_history')}
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon fontSize="small" />
							</InputAdornment>
						),
					}}
				/>
			</Box>

			{/* History List */}
			<Box sx={{ flex: 1, overflow: 'auto' }}>
				{filteredPrompts.length === 0 ? (
					<Box sx={{ p: 3, textAlign: 'center' }}>
						<HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
						<Typography variant="h6" color="text.secondary" gutterBottom>
							{searchTerm ? t('no_search_results') : t('no_history')}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{searchTerm ? t('try_different_search') : t('history_help')}
						</Typography>
					</Box>
				) : (
					<List dense sx={{ px: 1 }}>
						{filteredPrompts.map((prompt, index) => (
							<Paper key={`${prompt.source}-${prompt.id || index}`} sx={{ mb: 1 }}>
								<ListItem
									sx={{
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'stretch',
										py: 1.5,
									}}
								>
									<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
										<Box sx={{ flex: 1 }}>
											<Typography variant="caption" color="text.secondary">
												{formatDate(prompt.created_at)}
												{prompt.source === 'local' && (
													<Chip
														label={t('local')}
														size="small"
														sx={{ ml: 1, height: 18, fontSize: '0.6rem' }}
													/>
												)}
											</Typography>
										</Box>
										<IconButton
											size="small"
											onClick={(e) => handleMenuOpen(e, prompt)}
										>
											<MoreVertIcon fontSize="small" />
										</IconButton>
									</Box>

									<Box sx={{ mb: 1 }}>
										<Typography
											variant="body2"
											sx={{
												fontWeight: 'medium',
												mb: 0.5,
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												display: '-webkit-box',
												WebkitLineClamp: 2,
												WebkitBoxOrient: 'vertical',
											}}
										>
											{t('original')}: {prompt.original}
										</Typography>
										<Typography
											variant="body2"
											color="text.secondary"
											sx={{
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												display: '-webkit-box',
												WebkitLineClamp: 2,
												WebkitBoxOrient: 'vertical',
											}}
										>
											{t('optimized')}: {prompt.optimized}
										</Typography>
									</Box>

									<Box sx={{ display: 'flex', gap: 0.5 }}>
										<Tooltip title={t('copy_original')}>
											<IconButton
												size="small"
												onClick={() => onCopy(prompt.original)}
											>
												<CopyIcon fontSize="small" />
											</IconButton>
										</Tooltip>
										<Tooltip title={t('restore_to_input')}>
											<IconButton
												size="small"
												onClick={() => onRestore(prompt.original)}
											>
												<RestoreIcon fontSize="small" />
											</IconButton>
										</Tooltip>
									</Box>
								</ListItem>
							</Paper>
						))}
					</List>
				)}
			</Box>

			{/* Context Menu */}
			<Menu
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={handleMenuClose}
			>
				<MenuItem onClick={() => {
					if (selectedPrompt) onCopy(selectedPrompt.original);
					handleMenuClose();
				}}>
					<CopyIcon fontSize="small" sx={{ mr: 1 }} />
					{t('copy_original')}
				</MenuItem>
				<MenuItem onClick={() => {
					if (selectedPrompt) onCopy(selectedPrompt.optimized);
					handleMenuClose();
				}}>
					<CopyIcon fontSize="small" sx={{ mr: 1 }} />
					{t('copy_optimized')}
				</MenuItem>
				<MenuItem onClick={handleRestore}>
					<RestoreIcon fontSize="small" sx={{ mr: 1 }} />
					{t('restore_to_input')}
				</MenuItem>
				<MenuItem onClick={() => {
					if (selectedPrompt) onSendToChatGPT(selectedPrompt.optimized);
					handleMenuClose();
				}}>
					<ShareIcon fontSize="small" sx={{ mr: 1 }} />
					{t('send_to_chatgpt')}
				</MenuItem>
				<MenuItem onClick={() => {
					if (selectedPrompt) onSendToPerplexity(selectedPrompt.optimized);
					handleMenuClose();
				}}>
					<ShareIcon fontSize="small" sx={{ mr: 1 }} />
					{t('send_to_perplexity')}
				</MenuItem>
			</Menu>
		</Box>
	);
} 