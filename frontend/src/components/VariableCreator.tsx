/**
 * Variable Creator component for PrompTab
 * Provides a dialog interface for creating new variables from selected text with
 * customizable metadata including name, description, default value, and category assignment.
 */
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
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
	Alert,
	Chip,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	CircularProgress,
} from '@mui/material';
import { Close as CloseIcon, Save as SaveIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { apiService } from '@services/api';
import { VariableCategory } from '../types';

/**
 * Props for the VariableCreator component
 */
interface VariableCreatorProps {
	/** Whether the dialog is open */
	open: boolean;
	/** Callback function to close the dialog */
	onClose: () => void;
	/** The selected text that will be used as default value */
	selectedText: string;
	/** Suggested name for the variable */
	suggestedName?: string;
	/** Suggested type for the variable */
	suggestedType?: string;
}

/**
 * VariableCreator component allows users to create new variables
 * from selected text with metadata like name, description, and category
 */
export function VariableCreator({
	open,
	onClose,
	selectedText,
	suggestedName = '',
	suggestedType = 'text',
}: VariableCreatorProps) {
	const { t } = useTranslation();
	const [variableData, setVariableData] = useState({
		name: suggestedName,
		description: '',
		default_value: selectedText,
		type: suggestedType,
		category_id: '',
	});

	// Get variable categories
	const { data: categories = [] } = useQuery({
		queryKey: ['variable-categories'],
		queryFn: () => apiService.getVariableCategories(),
	});

	// Create variable mutation
	const createVariableMutation = useMutation({
		mutationFn: (data: {
			name: string;
			description?: string;
			default_value?: string;
			category_id?: string;
		}) => apiService.createVariable(data),
		onSuccess: () => {
			toast.success(t('variable_created'));
			onClose();
		},
		onError: (error: AxiosError<{ detail: string }>) => {
			toast.error(error.response?.data?.detail || t('variable_creation_error'));
		},
	});

	/**
	 * Handles form submission to create the variable
	 * @param e - Form submission event
	 */
	const handleSave = (e: React.FormEvent) => {
		e.preventDefault();
		if (!variableData.name.trim()) {
			toast.error(t('variable_name_required'));
			return;
		}

		createVariableMutation.mutate({
			name: variableData.name.trim(),
			description: variableData.description.trim() || undefined,
			default_value: variableData.default_value.trim() || undefined,
			category_id: variableData.category_id || undefined,
		});
	};

	/**
	 * Handles dialog close with validation
	 */
	const handleClose = () => {
		if (!createVariableMutation.isPending) {
			onClose();
		}
	};

	/**
	 * Generates a variable name from the selected text
	 */
	const generateVariableName = () => {
		const cleanText = selectedText
			.replace(/[^\w\s]/g, '')
			.trim()
			.split(/\s+/)
			.slice(0, 3)
			.join('_')
			.toLowerCase();

		setVariableData({
			...variableData,
			name: cleanText || 'new_variable',
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
				{t('create_variable')}
			</DialogTitle>

			<DialogContent>
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
					{selectedText && (
						<Alert severity="info" sx={{ mb: 1 }}>
							<Typography variant="body2">
								<strong>{t('selected_text')}:</strong> "{selectedText.substring(0, 100)}
								{selectedText.length > 100 ? '...' : ''}"
							</Typography>
						</Alert>
					)}

					<TextField
						fullWidth
						label={t('variable_name')}
						value={variableData.name}
						onChange={(e) => setVariableData({ ...variableData, name: e.target.value })}
						placeholder="my_variable"
						disabled={createVariableMutation.isPending}
						helperText={t('variable_name_help')}
						InputProps={{
							endAdornment: !variableData.name && selectedText && (
								<Button size="small" onClick={generateVariableName}>
									{t('generate')}
								</Button>
							),
						}}
					/>

					<TextField
						fullWidth
						label={t('description')}
						value={variableData.description}
						onChange={(e) => setVariableData({ ...variableData, description: e.target.value })}
						multiline
						rows={2}
						disabled={createVariableMutation.isPending}
						helperText={t('variable_description_help')}
					/>

					<TextField
						fullWidth
						label={t('default_value')}
						value={variableData.default_value}
						onChange={(e) => setVariableData({ ...variableData, default_value: e.target.value })}
						multiline
						rows={3}
						disabled={createVariableMutation.isPending}
						helperText={t('variable_default_help')}
					/>

					{categories.length > 0 && (
						<FormControl fullWidth>
							<InputLabel>{t('category')}</InputLabel>
							<Select
								value={variableData.category_id}
								onChange={(e) => setVariableData({ ...variableData, category_id: e.target.value })}
								disabled={createVariableMutation.isPending}
								label={t('category')}
							>
								<MenuItem value="">
									<em>{t('no_category')}</em>
								</MenuItem>
								{categories.map((category: VariableCategory) => (
									<MenuItem key={category.id} value={category.id}>
										{category.name}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					)}

					<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
						<Typography variant="body2" color="text.secondary">
							{t('variable_types')}:
						</Typography>
						{['text', 'number', 'boolean', 'array', 'object'].map((type) => (
							<Chip
								key={type}
								label={type}
								variant={variableData.type === type ? 'filled' : 'outlined'}
								size="small"
								onClick={() => setVariableData({ ...variableData, type })}
								disabled={createVariableMutation.isPending}
							/>
						))}
					</Box>
				</Box>
			</DialogContent>

			<DialogActions>
				<Button
					onClick={handleClose}
					disabled={createVariableMutation.isPending}
					startIcon={<CloseIcon />}
				>
					{t('cancel')}
				</Button>
				<Button
					type="submit"
					variant="contained"
					disabled={createVariableMutation.isPending || !variableData.name.trim()}
					startIcon={createVariableMutation.isPending ? <CircularProgress size={20} /> : <SaveIcon />}
				>
					{createVariableMutation.isPending ? t('creating') : t('create')}
				</Button>
			</DialogActions>
		</Dialog>
	);
} 