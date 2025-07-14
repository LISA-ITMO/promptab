/**
 * Save Prompt Dialog component for PrompTab
 * Provides a dialog interface for saving optimized prompts with metadata including
 * title, category, tags, and visibility settings. Supports template and public prompt creation.
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Button,
	Box,
	Typography,
	Chip,
	Switch,
	FormControlLabel,
	Alert,
	CircularProgress,
} from '@mui/material';
import { Close as CloseIcon, Save as SaveIcon, Add as AddIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { apiService, type OptimizeResponse } from '@services/api';
import { SavePromptRequest } from '../types';

/**
 * Props for the SavePromptDialog component
 */
interface SavePromptDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/** Callback function to close the dialog */
	onClose: () => void;
	/** The optimization result containing original and optimized prompts */
	optimizeResult: OptimizeResponse;
}

/**
 * SavePromptDialog component allows users to save optimized prompts
 * with metadata like title, category, tags, and visibility settings
 */
export function SavePromptDialog({
	open,
	onClose,
	optimizeResult,
}: SavePromptDialogProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [formData, setFormData] = useState({
		title: '',
		category: '',
		tags: [] as string[],
		is_template: true,
		is_public: false,
	});
	const [newTag, setNewTag] = useState('');

	// FIXED: Save prompt mutation - delayed invalidateQueries to prevent React #185
	const savePromptMutation = useMutation({
		mutationFn: (data: SavePromptRequest) => apiService.savePrompt(data),
		onSuccess: () => {
			// Delayed invalidation to prevent React #185 cycles
			setTimeout(() => {
				queryClient.invalidateQueries({ queryKey: ['user-templates'] });
			}, 100);

			setTimeout(() => {
				queryClient.invalidateQueries({ queryKey: ['user-prompts'] });
			}, 150);

			setTimeout(() => {
				try {
					toast.success(t('prompt_saved'));
				} catch (toastError) {
					console.debug('Toast error (non-critical):', toastError);
				}
			}, 200);

			setTimeout(() => {
				onClose();
				resetForm();
			}, 250);
		},
		onError: (error: AxiosError<{ detail: string }>) => {
			// Delayed error to prevent cycles
			setTimeout(() => {
				try {
					toast.error(error.response?.data?.detail || t('save_error'));
				} catch (toastError) {
					console.debug('Toast error (non-critical):', toastError);
				}
			}, 100);
		},
	});

	/**
	 * Resets the form data to initial state
	 */
	const resetForm = () => {
		setFormData({
			title: '',
			category: '',
			tags: [],
			is_template: true,
			is_public: false,
		});
		setNewTag('');
	};

	/**
	 * Handles form submission to save the prompt
	 * @param e - Form submission event
	 */
	const handleSave = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.title.trim()) {
			toast.error(t('title_required'));
			return;
		}

		savePromptMutation.mutate({
			title: formData.title.trim(),
			original_prompt: optimizeResult.original,
			optimized_prompt: optimizeResult.optimized,
			variables: optimizeResult.variables,
			category: formData.category.trim() || undefined,
			tags: formData.tags,
			is_template: formData.is_template,
			is_public: formData.is_public,
		});
	};

	/**
	 * Handles dialog close with validation
	 */
	const handleClose = () => {
		if (!savePromptMutation.isPending) {
			onClose();
			resetForm();
		}
	};

	/**
	 * Adds a new tag to the tags array
	 */
	const handleAddTag = () => {
		const tag = newTag.trim();
		if (tag && !formData.tags.includes(tag)) {
			setFormData({
				...formData,
				tags: [...formData.tags, tag],
			});
			setNewTag('');
		}
	};

	/**
	 * Removes a tag from the tags array
	 * @param tagToRemove - The tag to remove
	 */
	const handleRemoveTag = (tagToRemove: string) => {
		setFormData({
			...formData,
			tags: formData.tags.filter(tag => tag !== tagToRemove),
		});
	};

	/**
	 * Generates a title suggestion based on the original prompt
	 */
	const generateTitleSuggestion = () => {
		const words = optimizeResult.original
			.replace(/[^\w\s]/g, '')
			.split(/\s+/)
			.slice(0, 4)
			.join(' ');

		setFormData({
			...formData,
			title: words || 'Новый промпт',
		});
	};

	return (
		<Dialog
			open={open}
			onClose={handleClose}
			maxWidth="sm"
			fullWidth
			PaperProps={{
				component: 'form',
				onSubmit: handleSave,
			}}
		>
			<DialogTitle>
				{t('save_prompt')}
			</DialogTitle>

			<DialogContent>
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
					<Alert severity="info" sx={{ mb: 1 }}>
						{t('save_prompt_help')}
					</Alert>

					<TextField
						fullWidth
						label={t('title')}
						value={formData.title}
						onChange={(e) => setFormData({ ...formData, title: e.target.value })}
						placeholder={t('enter_title')}
						disabled={savePromptMutation.isPending}
						InputProps={{
							endAdornment: !formData.title && (
								<Button size="small" onClick={generateTitleSuggestion}>
									{t('suggest')}
								</Button>
							),
						}}
					/>

					<TextField
						fullWidth
						label={t('category')}
						value={formData.category}
						onChange={(e) => setFormData({ ...formData, category: e.target.value })}
						placeholder={t('enter_category')}
						disabled={savePromptMutation.isPending}
						helperText={t('category_help')}
					/>

					<Box>
						<Typography variant="body2" sx={{ mb: 1 }}>
							{t('tags')}
						</Typography>
						<Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
							<TextField
								size="small"
								placeholder={t('add_tag')}
								value={newTag}
								onChange={(e) => setNewTag(e.target.value)}
								disabled={savePromptMutation.isPending}
								onKeyPress={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										handleAddTag();
									}
								}}
							/>
							<Button
								size="small"
								variant="outlined"
								startIcon={<AddIcon />}
								onClick={handleAddTag}
								disabled={!newTag.trim() || savePromptMutation.isPending}
							>
								{t('add')}
							</Button>
						</Box>
						<Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
							{formData.tags.map((tag, index) => (
								<Chip
									key={index}
									label={tag}
									size="small"
									onDelete={() => handleRemoveTag(tag)}
									disabled={savePromptMutation.isPending}
								/>
							))}
						</Box>
					</Box>

					<Box>
						<FormControlLabel
							control={
								<Switch
									checked={formData.is_template}
									onChange={(e) => setFormData({ ...formData, is_template: e.target.checked })}
									disabled={savePromptMutation.isPending}
								/>
							}
							label={t('save_as_template')}
						/>
						<Typography variant="caption" color="text.secondary" display="block">
							{t('template_help')}
						</Typography>
					</Box>

					<Box>
						<FormControlLabel
							control={
								<Switch
									checked={formData.is_public}
									onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
									disabled={savePromptMutation.isPending}
								/>
							}
							label={t('make_public')}
						/>
						<Typography variant="caption" color="text.secondary" display="block">
							{t('public_help')}
						</Typography>
					</Box>

					{/* Preview */}
					<Box sx={{ mt: 1 }}>
						<Typography variant="body2" color="text.secondary" gutterBottom>
							{t('preview')}:
						</Typography>
						<Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1, fontSize: '0.875rem' }}>
							<Typography variant="body2" fontWeight="medium" gutterBottom>
								{formData.title || t('untitled_prompt')}
							</Typography>
							<Typography variant="caption" color="text.secondary">
								{optimizeResult.optimized.substring(0, 150)}...
							</Typography>
						</Box>
					</Box>
				</Box>
			</DialogContent>

			<DialogActions>
				<Button
					onClick={handleClose}
					disabled={savePromptMutation.isPending}
					startIcon={<CloseIcon />}
				>
					{t('cancel')}
				</Button>
				<Button
					type="submit"
					variant="contained"
					disabled={savePromptMutation.isPending || !formData.title.trim()}
					startIcon={savePromptMutation.isPending ? <CircularProgress size={20} /> : <SaveIcon />}
				>
					{savePromptMutation.isPending ? t('saving') : t('save')}
				</Button>
			</DialogActions>
		</Dialog>
	);
} 