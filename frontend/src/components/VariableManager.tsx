/**
 * Variable Manager component for PrompTab
 * Provides a comprehensive interface for managing user variables with search, filtering,
 * editing, deletion, and usage capabilities. Supports variable categories and syntax copying.
 */
import React, { useState, useCallback, useMemo } from 'react';
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
	TextField,
	InputAdornment,
	Menu,
	MenuItem,
	Chip,
	Skeleton,
	Tooltip,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	FormControl,
	InputLabel,
	Select,
} from '@mui/material';
import {
	Search as SearchIcon,
	Add as AddIcon,
	Edit as EditIcon,
	Delete as DeleteIcon,
	MoreVert as MoreVertIcon,
	Code as VariableIcon,
	Category as CategoryIcon,
	ContentCopy as CopyIcon,
	Folder as FolderIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { apiService } from '@services/api';
import { Variable, VariableCategory } from '../types/index';

/**
 * Props for the VariableManager component
 */
interface VariableManagerProps {
	/** Callback function when a variable is used */
	onUseVariable?: (variable: Variable) => void;
	/** Callback function to copy text to clipboard */
	onCopy?: (text: string) => void;
}

/**
 * VariableManager component displays a list of user variables with search,
 * filtering, and management capabilities (edit, delete, use)
 */
export function VariableManager({ onUseVariable, onCopy }: VariableManagerProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<string>('');
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [selectedVariable, setSelectedVariable] = useState<Variable | null>(null);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [editForm, setEditForm] = useState({
		name: '',
		description: '',
		default_value: '',
		category_id: '',
	});

	// Get variables
	const { data: variables = [], isLoading } = useQuery({
		queryKey: ['variables', selectedCategory],
		queryFn: () => apiService.getVariables({
			category_id: selectedCategory || undefined,
		}),
	});

	// Get variable categories
	const { data: categories = [] } = useQuery({
		queryKey: ['variable-categories'],
		queryFn: () => apiService.getVariableCategories(),
	});

	// FIXED: Delete variable mutation - delayed invalidateQueries to prevent React #185
	const deleteVariableMutation = useMutation({
		mutationFn: (id: string) => apiService.deleteVariable(id),
		onSuccess: () => {
			// Delayed invalidation to prevent React #185 cycles
			setTimeout(() => {
				queryClient.invalidateQueries({ queryKey: ['variables'] });
			}, 100);

			setTimeout(() => {
				try {
					toast.success(t('variable_deleted'));
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

	// FIXED: Update variable mutation - delayed invalidateQueries to prevent React #185
	const updateVariableMutation = useMutation({
		mutationFn: ({ id, data }: { id: string; data: any }) =>
			apiService.updateVariable(id, data),
		onSuccess: () => {
			// Delayed invalidation to prevent React #185 cycles
			setTimeout(() => {
				queryClient.invalidateQueries({ queryKey: ['variables'] });
			}, 100);

			setTimeout(() => {
				try {
					toast.success(t('variable_updated'));
				} catch (toastError) {
					console.debug('Toast error (non-critical):', toastError);
				}
			}, 200);

			setTimeout(() => {
				setEditDialogOpen(false);
			}, 250);
		},
		onError: (error: any) => {
			// Delayed error to prevent cycles
			setTimeout(() => {
				try {
					toast.error(error.response?.data?.detail || t('update_error'));
				} catch (toastError) {
					console.debug('Toast error (non-critical):', toastError);
				}
			}, 100);
		}
	});

	// Memoized filtered variables to prevent recalculation on every render
	const filteredVariables = useMemo(() => {
		return variables.filter((variable: Variable) =>
			!searchTerm ||
			variable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			variable.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			variable.default_value?.toLowerCase().includes(searchTerm.toLowerCase())
		);
	}, [variables, searchTerm]);

	// Memoized category name lookup function
	const getCategoryName = useCallback((categoryId: string) => {
		const category = categories.find((c: VariableCategory) => c.id === categoryId);
		return category?.name || '';
	}, [categories]);

	// Memoized safe translate function
	const safeTranslate = useCallback((key: string, fallback?: string) => {
		try {
			return t(key);
		} catch {
			return fallback || key;
		}
	}, [t]);

	/**
	 * Opens the context menu for a variable
	 * @param event - Mouse event that triggered the menu
	 * @param variable - The variable to show menu for
	 */
	const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, variable: Variable) => {
		setAnchorEl(event.currentTarget);
		setSelectedVariable(variable);
	}, []);

	/**
	 * Closes the context menu
	 */
	const handleMenuClose = useCallback(() => {
		setAnchorEl(null);
		setSelectedVariable(null);
	}, []);

	/**
	 * Opens the edit dialog for the selected variable
	 */
	const handleEditVariable = useCallback(() => {
		if (selectedVariable) {
			setEditForm({
				name: selectedVariable.name,
				description: selectedVariable.description || '',
				default_value: selectedVariable.default_value || '',
				category_id: selectedVariable.category_id || '',
			});
			setEditDialogOpen(true);
		}
		handleMenuClose();
	}, [selectedVariable, handleMenuClose]);

	/**
	 * Saves the edited variable
	 */
	const handleSaveVariable = useCallback(() => {
		if (!selectedVariable) return;

		const updateData = {
			name: editForm.name.trim(),
			description: editForm.description.trim() || undefined,
			default_value: editForm.default_value.trim() || undefined,
			category_id: editForm.category_id || undefined,
		};

		updateVariableMutation.mutate({
			id: selectedVariable.id,
			data: updateData,
		});
	}, [selectedVariable, editForm, updateVariableMutation]);

	/**
	 * Deletes the selected variable
	 */
	const handleDeleteVariable = useCallback(() => {
		if (selectedVariable) {
			deleteVariableMutation.mutate(selectedVariable.id);
		}
		handleMenuClose();
	}, [selectedVariable, deleteVariableMutation, handleMenuClose]);

	/**
	 * Uses the selected variable (calls onUseVariable callback)
	 * @param variable - The variable to use
	 */
	const handleUseVariable = useCallback((variable: Variable) => {
		if (onUseVariable) {
			onUseVariable(variable);
			toast.success(t('variable_applied'));
		}
	}, [onUseVariable, t]);

	/**
	 * Copies the syntax of the selected variable to clipboard
	 * @param variable - The variable to copy syntax for
	 */
	const handleCopyVariable = useCallback((variable: Variable) => {
		const variableText = `{{${variable.name}}}`;
		if (onCopy) {
			onCopy(variableText);
			toast.success(t('variable_syntax_copied'));
		}
	}, [onCopy, t]);

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
		<Box sx={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
			{/* Header Controls */}
			<Box sx={{ p: 2, pb: 1 }}>
				<TextField
					fullWidth
					size="small"
					placeholder={safeTranslate('search_variables', 'Search variables...')}
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

				{categories.length > 0 && (
					<Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
						<Chip
							label={safeTranslate('all_categories', 'All Categories')}
							variant={selectedCategory === '' ? 'filled' : 'outlined'}
							size="small"
							onClick={() => setSelectedCategory('')}
							icon={<FolderIcon fontSize="small" />}
						/>
						{categories.map((category: VariableCategory) => (
							<Chip
								key={category.id}
								label={category.name}
								variant={selectedCategory === category.id ? 'filled' : 'outlined'}
								size="small"
								onClick={() => setSelectedCategory(category.id)}
								icon={<CategoryIcon fontSize="small" />}
							/>
						))}
					</Box>
				)}
			</Box>

			{/* Variables Grid */}
			<Box sx={{ flex: 1, overflow: 'auto', px: 2 }}>
				{filteredVariables.length === 0 ? (
					<Box sx={{ textAlign: 'center', py: 4 }}>
						<VariableIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
						<Typography variant="h6" color="text.secondary" gutterBottom>
							{searchTerm ? safeTranslate('no_variables_found', 'No variables found') : safeTranslate('no_variables', 'No variables')}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{searchTerm ? safeTranslate('try_different_search', 'Try a different search') : safeTranslate('create_first_variable', 'Create your first variable')}
						</Typography>

					</Box>
				) : (
					<Grid container spacing={1.5}>
						{filteredVariables.map((variable: Variable) => (
							<Grid item xs={12} key={variable.id}>
								<Card
									sx={{
										cursor: 'pointer',
										'&:hover': { boxShadow: 2 },
										transition: 'box-shadow 0.2s',
									}}
									onClick={() => handleUseVariable(variable)}
								>
									<CardContent sx={{ pb: 1 }}>
										<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
												<VariableIcon color="primary" fontSize="small" />
												<Typography variant="subtitle2" component="h3" sx={{ fontWeight: 600 }}>
													{variable.name}
												</Typography>
											</Box>
											<IconButton
												size="small"
												onClick={(e) => {
													e.stopPropagation();
													handleMenuOpen(e, variable);
												}}
											>
												<MoreVertIcon fontSize="small" />
											</IconButton>
										</Box>

										{variable.description && (
											<Typography
												variant="body2"
												color="text.secondary"
												sx={{ mb: 1 }}
											>
												{variable.description}
											</Typography>
										)}

										{variable.default_value && (
											<Box sx={{ mb: 1 }}>
												<Typography variant="caption" color="text.secondary">
													{safeTranslate('default_value', 'Default value')}:
												</Typography>
												<Typography
													variant="body2"
													sx={{
														p: 0.5,
														bgcolor: 'grey.50',
														borderRadius: 0.5,
														fontFamily: 'monospace',
														fontSize: '0.75rem',
														overflow: 'hidden',
														textOverflow: 'ellipsis',
														whiteSpace: 'nowrap',
													}}
												>
													{variable.default_value}
												</Typography>
											</Box>
										)}

										{variable.category_id && (
											<Chip
												label={getCategoryName(variable.category_id)}
												size="small"
												variant="outlined"
												sx={{ mr: 1 }}
											/>
										)}

										<Typography variant="caption" color="text.secondary">
											{safeTranslate('syntax', 'Syntax')}: {`{{${variable.name}}}`}
										</Typography>
									</CardContent>

									<CardActions sx={{ pt: 0, px: 2, pb: 1 }}>
										<Tooltip title={safeTranslate('copy_syntax', 'Copy syntax')}>
											<IconButton
												size="small"
												onClick={(e) => {
													e.stopPropagation();
													handleCopyVariable(variable);
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
					if (selectedVariable) handleUseVariable(selectedVariable);
					handleMenuClose();
				}}>
					<AddIcon fontSize="small" sx={{ mr: 1 }} />
					{safeTranslate('use_variable', 'Use Variable')}
				</MenuItem>
				<MenuItem onClick={() => {
					if (selectedVariable) handleCopyVariable(selectedVariable);
					handleMenuClose();
				}}>
					<CopyIcon fontSize="small" sx={{ mr: 1 }} />
					{safeTranslate('copy_syntax', 'Copy Syntax')}
				</MenuItem>
				<MenuItem onClick={handleEditVariable}>
					<EditIcon fontSize="small" sx={{ mr: 1 }} />
					{safeTranslate('edit', 'Edit')}
				</MenuItem>
				<MenuItem onClick={handleDeleteVariable} sx={{ color: 'error.main' }}>
					<DeleteIcon fontSize="small" sx={{ mr: 1 }} />
					{safeTranslate('delete', 'Delete')}
				</MenuItem>
			</Menu>

			{/* Edit Variable Dialog */}
			<Dialog
				open={editDialogOpen}
				onClose={() => setEditDialogOpen(false)}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>
					{safeTranslate('edit_variable', 'Edit Variable')}
				</DialogTitle>
				<DialogContent>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
						<TextField
							label={safeTranslate('variable_name', 'Variable Name')}
							value={editForm.name}
							onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
							fullWidth
							required
							placeholder="my_variable"
							helperText={safeTranslate('variable_name_help', 'Use lowercase letters, numbers and underscores only')}
						/>

						<TextField
							label={safeTranslate('description', 'Description')}
							value={editForm.description}
							onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
							fullWidth
							multiline
							rows={2}
							placeholder={safeTranslate('description_placeholder', 'Describe what this variable is used for...')}
						/>

						<TextField
							label={safeTranslate('default_value', 'Default Value')}
							value={editForm.default_value}
							onChange={(e) => setEditForm({ ...editForm, default_value: e.target.value })}
							fullWidth
							multiline
							rows={2}
							placeholder={safeTranslate('default_value_placeholder', 'Enter the default value for this variable...')}
						/>

						<FormControl fullWidth>
							<InputLabel>{safeTranslate('category', 'Category')}</InputLabel>
							<Select
								value={editForm.category_id}
								onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
								label={safeTranslate('category', 'Category')}
							>
								<MenuItem value="">
									{safeTranslate('no_category', 'No Category')}
								</MenuItem>
								{categories.map((category: VariableCategory) => (
									<MenuItem key={category.id} value={category.id}>
										{category.name}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setEditDialogOpen(false)}>
						{safeTranslate('cancel', 'Cancel')}
					</Button>
					<Button
						onClick={handleSaveVariable}
						variant="contained"
						disabled={!editForm.name.trim() || updateVariableMutation.isPending}
					>
						{updateVariableMutation.isPending ? safeTranslate('saving', 'Saving...') : safeTranslate('save', 'Save')}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
} 