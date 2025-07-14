/**
 * Templates Tab component for PrompTab
 * Displays and manages user templates and public templates with search, filtering,
 * categorization, and template usage capabilities. Supports template viewing and deletion.
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	Box,
	Grid,
	Card,
	CardContent,
	CardActions,
	Typography,
	IconButton,
	Button,
	TextField,
	InputAdornment,
	Menu,
	MenuItem,
	Chip,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Skeleton,
	Tooltip,
} from '@mui/material';
import {
	Search as SearchIcon,
	MoreVert as MoreVertIcon,
	Add as AddIcon,
	Category as CategoryIcon,
	ContentCopy as CopyIcon,
	Delete as DeleteIcon,
	Visibility as ViewIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { apiService } from '@services/api';
import { Prompt } from '../types/index';

/**
 * Props for the TemplatesTab component
 */
interface TemplatesTabProps {
	/** Callback function when a template is used */
	onUseTemplate: (prompt: string) => void;
	/** Callback function to copy text to clipboard */
	onCopy: (text: string) => void;
}

/**
 * TemplatesTab component displays a list of user and public templates
 * with search, filtering, and management capabilities
 */
export function TemplatesTab({ onUseTemplate, onCopy }: TemplatesTabProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<string>('');
	const [showPublic, setShowPublic] = useState(false);
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [selectedTemplate, setSelectedTemplate] = useState<Prompt | null>(null);
	const [viewDialogOpen, setViewDialogOpen] = useState(false);
	const [templateToView, setTemplateToView] = useState<Prompt | null>(null);

	// Get user templates
	const { data: userTemplates = [], isLoading: loadingUser } = useQuery({
		queryKey: ['user-templates', searchTerm, selectedCategory],
		queryFn: () => apiService.getMyPrompts({
			is_template: true,
			category: selectedCategory || undefined,
			limit: 20,
		}),
	});

	// FIXED: Get public templates - removed searchTerm from queryKey to prevent unnecessary refetches
	const { data: publicTemplates = [], isLoading: loadingPublic } = useQuery({
		queryKey: ['public-templates'], // Removed searchTerm to prevent React #185 cycles
		queryFn: () => apiService.getPublicPrompts({
			limit: 20,
		}),
		enabled: showPublic,
		staleTime: 5 * 60 * 1000, // 5 minutes cache to reduce requests
	});

	// FIXED: Delete template mutation - removed invalidateQueries to prevent cycles
	const deleteTemplateMutation = useMutation({
		mutationFn: (id: string) => apiService.deletePrompt(id),
		onSuccess: () => {
			// Only invalidate when necessary and with delay to prevent React #185
			setTimeout(() => {
				queryClient.invalidateQueries({ queryKey: ['user-templates'] });
			}, 100);

			setTimeout(() => {
				try {
					toast.success(t('template_deleted'));
				} catch (toastError) {
					console.debug('Toast error (non-critical):', toastError);
				}
			}, 200);
		},
		onError: (error: any) => {
			// Delayed error to prevent cycles
			setTimeout(() => {
				try {
					toast.error(error.response?.data?.detail || t('delete_error'));
				} catch (toastError) {
					console.debug('Toast error (non-critical):', toastError);
				}
			}, 100);
		},
	});

	const templates = showPublic ? publicTemplates : userTemplates;
	const isLoading = showPublic ? loadingPublic : loadingUser;

	/**
	 * Opens the context menu for a template
	 * @param event - Mouse event that triggered the menu
	 * @param template - The template to show menu for
	 */
	const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, template: Prompt) => {
		setAnchorEl(event.currentTarget);
		setSelectedTemplate(template);
	};

	/**
	 * Closes the context menu
	 */
	const handleMenuClose = () => {
		setAnchorEl(null);
		setSelectedTemplate(null);
	};

	/**
	 * Uses the selected template (calls onUseTemplate callback)
	 * @param template - The template to use
	 */
	const handleUseTemplate = (template: Prompt) => {
		onUseTemplate(template.optimized_prompt || template.original_prompt);
		toast.success(t('template_applied'));
	};

	/**
	 * Opens the view dialog for the selected template
	 * @param template - The template to view
	 */
	const handleViewTemplate = (template: Prompt) => {
		setTemplateToView(template);
		setViewDialogOpen(true);
	};

	/**
	 * Deletes the selected template
	 */
	const handleDeleteTemplate = () => {
		if (selectedTemplate) {
			deleteTemplateMutation.mutate(selectedTemplate.id);
		}
		handleMenuClose();
	};

	/**
	 * Gets unique categories from user templates
	 * @returns Array of unique category names
	 */
	const getTemplateCategories = (): string[] => {
		const categories = new Set(userTemplates.map((t: Prompt) => t.category).filter(Boolean));
		return Array.from(categories) as string[];
	};

	/**
	 * Formats usage count into human-readable text
	 * @param count - The usage count
	 * @returns Formatted usage text
	 */
	const formatUsageCount = (count: number) => {
		if (count === 0) return t('not_used');
		if (count === 1) return t('used_once');
		return t('used_times', { count });
	};

	if (isLoading) {
		return (
			<Box sx={{ p: 2 }}>
				<Grid container spacing={2}>
					{[...Array(6)].map((_, index) => (
						<Grid item xs={12} sm={6} key={index}>
							<Card>
								<CardContent>
									<Skeleton variant="text" width="80%" height={24} />
									<Skeleton variant="text" width="100%" height={20} />
									<Skeleton variant="text" width="60%" height={16} />
								</CardContent>
							</Card>
						</Grid>
					))}
				</Grid>
			</Box>
		);
	}

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
			{/* Header Controls */}
			<Box sx={{ p: 2, pb: 1 }}>
				<Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
					<Button
						variant={!showPublic ? 'contained' : 'outlined'}
						size="small"
						onClick={() => setShowPublic(false)}
					>
						{t('my_templates')}
					</Button>
					<Button
						variant={showPublic ? 'contained' : 'outlined'}
						size="small"
						onClick={() => setShowPublic(true)}
					>
						{t('public_templates')}
					</Button>
				</Box>

				<TextField
					fullWidth
					size="small"
					placeholder={t('search_templates')}
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon fontSize="small" />
							</InputAdornment>
						),
					}}
					sx={{ mb: 1 }}
				/>

				{!showPublic && getTemplateCategories().length > 0 && (
					<Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
						<Chip
							label={t('all_categories')}
							variant={selectedCategory === '' ? 'filled' : 'outlined'}
							size="small"
							onClick={() => setSelectedCategory('')}
						/>
						{getTemplateCategories().map((category: string) => (
							<Chip
								key={category}
								label={category}
								variant={selectedCategory === category ? 'filled' : 'outlined'}
								size="small"
								onClick={() => setSelectedCategory(category)}
							/>
						))}
					</Box>
				)}
			</Box>

			{/* Templates Grid */}
			<Box sx={{ flex: 1, overflow: 'auto', px: 2 }}>
				{templates.length === 0 ? (
					<Box sx={{ textAlign: 'center', py: 4 }}>
						<CategoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
						<Typography variant="h6" color="text.secondary" gutterBottom>
							{searchTerm ? t('no_templates_found') : t('no_templates')}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{showPublic ? t('try_different_search') : t('create_first_template')}
						</Typography>
					</Box>
				) : (
					<Grid container spacing={1.5}>
						{templates.map((template: Prompt) => (
							<Grid item xs={12} key={template.id}>
								<Card
									sx={{
										cursor: 'pointer',
										'&:hover': { boxShadow: 2 },
										transition: 'box-shadow 0.2s',
									}}
									onClick={() => handleViewTemplate(template)}
								>
									<CardContent sx={{ pb: 1 }}>
										<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
											<Typography variant="subtitle2" component="h3" sx={{ fontWeight: 600 }}>
												{template.title}
											</Typography>
											<IconButton
												size="small"
												onClick={(e) => {
													e.stopPropagation();
													handleMenuOpen(e, template);
												}}
											>
												<MoreVertIcon fontSize="small" />
											</IconButton>
										</Box>

										<Typography
											variant="body2"
											color="text.secondary"
											sx={{
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												display: '-webkit-box',
												WebkitLineClamp: 2,
												WebkitBoxOrient: 'vertical',
												mb: 1,
											}}
										>
											{template.optimized_prompt || template.original_prompt}
										</Typography>

										<Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
											{template.category && (
												<Chip label={template.category} size="small" variant="outlined" />
											)}
											{template.tags?.map((tag, index) => (
												<Chip key={index} label={tag} size="small" variant="outlined" />
											))}
										</Box>

										<Typography variant="caption" color="text.secondary">
											{formatUsageCount(template.usage_count)}
											{template.is_public && (
												<Chip
													label={t('public')}
													size="small"
													sx={{ ml: 1, height: 16, fontSize: '0.6rem' }}
												/>
											)}
										</Typography>
									</CardContent>

									<CardActions sx={{ pt: 0, px: 2, pb: 1 }}>
										<Button
											size="small"
											startIcon={<AddIcon />}
											onClick={(e) => {
												e.stopPropagation();
												handleUseTemplate(template);
											}}
										>
											{t('use_template')}
										</Button>
										<Tooltip title={t('copy')}>
											<IconButton
												size="small"
												onClick={(e) => {
													e.stopPropagation();
													onCopy(template.optimized_prompt || template.original_prompt);
													toast.success(t('copied'));
												}}
											>
												<CopyIcon fontSize="small" />
											</IconButton>
										</Tooltip>
									</CardActions>
								</Card>
							</Grid>
						))}
					</Grid>
				)}
			</Box>

			{/* Context Menu */}
			<Menu
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={handleMenuClose}
			>
				<MenuItem onClick={() => {
					if (selectedTemplate) handleUseTemplate(selectedTemplate);
					handleMenuClose();
				}}>
					<AddIcon fontSize="small" sx={{ mr: 1 }} />
					{t('use_template')}
				</MenuItem>
				<MenuItem onClick={() => {
					if (selectedTemplate) handleViewTemplate(selectedTemplate);
					handleMenuClose();
				}}>
					<ViewIcon fontSize="small" sx={{ mr: 1 }} />
					{t('view_details')}
				</MenuItem>
				<MenuItem onClick={() => {
					if (selectedTemplate) onCopy(selectedTemplate.optimized_prompt || selectedTemplate.original_prompt);
					handleMenuClose();
				}}>
					<CopyIcon fontSize="small" sx={{ mr: 1 }} />
					{t('copy')}
				</MenuItem>
				{!showPublic && (
					<MenuItem onClick={handleDeleteTemplate} sx={{ color: 'error.main' }}>
						<DeleteIcon fontSize="small" sx={{ mr: 1 }} />
						{t('delete')}
					</MenuItem>
				)}
			</Menu>

			{/* Template View Dialog */}
			<Dialog
				open={viewDialogOpen}
				onClose={() => setViewDialogOpen(false)}
				maxWidth="md"
				fullWidth
			>
				{templateToView && (
					<>
						<DialogTitle>
							{templateToView.title}
							{templateToView.is_public && (
								<Chip
									label={t('public')}
									size="small"
									sx={{ ml: 1 }}
								/>
							)}
						</DialogTitle>
						<DialogContent>
							<Box sx={{ mb: 2 }}>
								<Typography variant="body2" color="text.secondary" gutterBottom>
									{t('original_prompt')}:
								</Typography>
								<Typography variant="body2" sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
									{templateToView.original_prompt}
								</Typography>
							</Box>

							{templateToView.optimized_prompt && (
								<Box sx={{ mb: 2 }}>
									<Typography variant="body2" color="text.secondary" gutterBottom>
										{t('optimized_prompt')}:
									</Typography>
									<Typography variant="body2" sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
										{templateToView.optimized_prompt}
									</Typography>
								</Box>
							)}

							{(templateToView.category || templateToView.tags?.length) && (
								<Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
									{templateToView.category && (
										<Chip label={templateToView.category} size="small" />
									)}
									{templateToView.tags?.map((tag, index) => (
										<Chip key={index} label={tag} size="small" variant="outlined" />
									))}
								</Box>
							)}

							<Typography variant="caption" color="text.secondary">
								{formatUsageCount(templateToView.usage_count)} •
								{t('created')}: {new Date(templateToView.created_at).toLocaleDateString()}
							</Typography>
						</DialogContent>
						<DialogActions>
							<Button onClick={() => setViewDialogOpen(false)}>
								{t('close')}
							</Button>
							<Button
								variant="contained"
								onClick={() => {
									handleUseTemplate(templateToView);
									setViewDialogOpen(false);
								}}
							>
								{t('use_template')}
							</Button>
						</DialogActions>
					</>
				)}
			</Dialog>
		</Box>
	);
} 