/**
 * Prompt with Variables component for PrompTab
 * Provides a text input field with variable support using {{variable_name}} syntax.
 * Features variable insertion, validation, preview with default values, and syntax help.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
	Box,
	TextField,
	Typography,
	Paper,
	Chip,
	IconButton,

	Tooltip,
	Popover,
	List,
	ListItem,
	ListItemText,
	ListItemButton,
	Alert,
} from '@mui/material';
import {
	Code as VariableIcon,
	Help as HelpIcon,
	Add as AddIcon,
	Visibility as PreviewIcon,
} from '@mui/icons-material';
import { Variable } from '../types/index';

/**
 * Props for the PromptWithVariables component
 */
interface PromptWithVariablesProps {
	/** The current value of the prompt text */
	value: string;
	/** Callback function when the prompt text changes */
	onChange: (value: string) => void;
	/** Array of available variables */
	variables?: Variable[];
	/** Placeholder text for the input field */
	placeholder?: string;
	/** Whether the input is disabled */
	disabled?: boolean;
	/** Whether to show the preview of the prompt with variable values */
	showPreview?: boolean;
	/** Callback function to create a new variable from selected text */
	onCreateVariable?: (selectedText: string) => void;
}

/**
 * Represents a parsed variable found in the prompt text
 */
interface ParsedVariable {
	/** The name of the variable */
	name: string;
	/** Start index of the variable in the text */
	startIndex: number;
	/** End index of the variable in the text */
	endIndex: number;
	/** Whether the variable is valid (exists in variables array) */
	isValid: boolean;
	/** The variable object if valid */
	variable?: Variable;
}

/**
 * PromptWithVariables component provides a text input field with variable support
 * It allows users to insert variables using {{variable_name}} syntax and provides
 * visual feedback for valid/invalid variables
 */
export function PromptWithVariables({
	value,
	onChange,
	variables = [],
	placeholder,
	disabled = false,
	showPreview = true,
	onCreateVariable,
}: PromptWithVariablesProps) {
	const { t } = useTranslation();
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
	const [showSyntaxHelp, setShowSyntaxHelp] = useState(false);
	const [parsedVariables, setParsedVariables] = useState<ParsedVariable[]>([]);
	const [previewText, setPreviewText] = useState('');

	// FIXED: Parse variables from text - safe dependencies to prevent React #185 cycles
	useEffect(() => {
		const variableRegex = /\{\{([^}]+)\}\}/g;
		const matches: ParsedVariable[] = [];
		let match;

		while ((match = variableRegex.exec(value)) !== null) {
			const variableName = match[1]?.trim();
			if (!variableName) continue;
			const variable = variables.find(v => v.name === variableName);

			matches.push({
				name: variableName,
				startIndex: match.index,
				endIndex: match.index + match[0].length,
				isValid: !!variable,
				variable,
			});
		}

		// Only update if actually different to prevent cycles
		if (JSON.stringify(matches) !== JSON.stringify(parsedVariables)) {
			setParsedVariables(matches);
		}
	}, [value, variables]); // Safe dependencies - no state dependencies

	// FIXED: Generate preview text - removed parsedVariables dependency to prevent React #185 cycles
	useEffect(() => {
		if (!showPreview || !value) return;

		// Parse variables directly to avoid dependency cycles
		const variableRegex = /\{\{([^}]+)\}\}/g;
		let preview = value;
		let match;

		while ((match = variableRegex.exec(value)) !== null) {
			const variableName = match[1]?.trim();
			if (!variableName) continue;

			const variable = variables.find(v => v.name === variableName);
			if (variable && variable.default_value) {
				const placeholder = `{{${variableName}}}`;
				preview = preview.replace(placeholder, variable.default_value);
			}
		}

		// Only update if actually different to prevent cycles
		if (preview !== previewText) {
			setPreviewText(preview);
		}
	}, [value, showPreview, variables]); // Removed parsedVariables dependency

	// Memoized invalid variables to prevent recalculation
	const invalidVariables = useMemo(() => {
		return parsedVariables.filter(v => !v.isValid);
	}, [parsedVariables]);

	// Memoized used variables to prevent recalculation
	const usedVariables = useMemo(() => {
		return parsedVariables.filter(v => v.isValid).map(v => v.variable!);
	}, [parsedVariables]);

	/**
	 * Handles text selection in the input field
	 * Triggers variable creation if text is selected and long enough
	 */
	const handleTextSelection = useCallback(() => {
		const selection = window.getSelection();
		const selectedText = selection?.toString().trim();

		if (selectedText && selectedText.length > 3 && onCreateVariable) {
			onCreateVariable(selectedText);
		}
	}, [onCreateVariable]);

	/**
	 * Inserts a variable into the input field at the current cursor position
	 * @param variable - The variable to insert
	 */
	const insertVariable = useCallback((variable: Variable) => {
		const variableSyntax = `{{${variable.name}}}`;
		const textarea = document.querySelector('textarea[data-prompt-input]') as HTMLTextAreaElement;

		if (textarea) {
			const start = textarea.selectionStart;
			const end = textarea.selectionEnd;
			const newValue = value.substring(0, start) + variableSyntax + value.substring(end);
			onChange(newValue);

			// Set cursor position after inserted variable
			setTimeout(() => {
				textarea.focus();
				textarea.setSelectionRange(start + variableSyntax.length, start + variableSyntax.length);
			}, 0);
		} else {
			// Fallback: append to end
			onChange(value + (value.endsWith(' ') ? '' : ' ') + variableSyntax);
		}

		setAnchorEl(null);
	}, [value, onChange]);

	/**
	 * Gets all invalid variables (variables that don't exist in the variables array)
	 * @returns Array of invalid parsed variables
	 */
	const getInvalidVariables = useCallback(() => {
		return invalidVariables;
	}, [invalidVariables]);

	/**
	 * Gets all used variables (variables that exist in the variables array)
	 * @returns Array of valid variables
	 */
	const getUsedVariables = useCallback(() => {
		return usedVariables;
	}, [usedVariables]);

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
			{/* Input Field */}
			<Box sx={{ position: 'relative' }}>
				<TextField
					multiline
					rows={4}
					fullWidth
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					disabled={disabled}
					onMouseUp={handleTextSelection}
					inputProps={{
						'data-prompt-input': true,
					}}
					sx={{
						'& .MuiOutlinedInput-root': {
							fontFamily: 'monospace',
							fontSize: '0.875rem',
						},
					}}
				/>

				{/* Variable insertion button */}
				<Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 0.5 }}>
					<Tooltip title={t('insert_variable')}>
						<IconButton
							size="small"
							onClick={(e) => setAnchorEl(e.currentTarget)}
							disabled={disabled || variables.length === 0}
						>
							<VariableIcon fontSize="small" />
						</IconButton>
					</Tooltip>
					<Tooltip title={t('syntax_help')}>
						<IconButton
							size="small"
							onClick={() => setShowSyntaxHelp(!showSyntaxHelp)}
						>
							<HelpIcon fontSize="small" />
						</IconButton>
					</Tooltip>
				</Box>
			</Box>

			{/* Syntax Help */}
			{showSyntaxHelp && (
				<Alert severity="info" sx={{ fontSize: '0.875rem' }}>
					<Typography variant="body2" gutterBottom>
						{t('variable_syntax_help')}
					</Typography>
					<Typography variant="body2" component="div">
						• {t('use_double_braces')}: <code>{'{{variable_name}}'}</code><br />
						• {t('variable_example')}: <code>{'{{user_name}}'}</code><br />
						• {t('variables_replaced_automatically')}
					</Typography>
				</Alert>
			)}

			{/* Used Variables */}
			{getUsedVariables().length > 0 && (
				<Box>
					<Typography variant="caption" color="text.secondary" gutterBottom>
						{t('used_variables')}:
					</Typography>
					<Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
						{getUsedVariables().map((variable, index) => (
							<Chip
								key={index}
								label={variable.name}
								size="small"
								icon={<VariableIcon />}
								variant="outlined"
								color="primary"
							/>
						))}
					</Box>
				</Box>
			)}

			{/* Invalid Variables Warning */}
			{getInvalidVariables().length > 0 && (
				<Alert severity="warning" sx={{ fontSize: '0.875rem' }}>
					<Typography variant="body2" gutterBottom>
						{t('undefined_variables_found')}:
					</Typography>
					<Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
						{getInvalidVariables().map((variable, index) => (
							<Chip
								key={index}
								label={variable.name}
								size="small"
								color="error"
								variant="outlined"
								onDelete={onCreateVariable ? () => onCreateVariable(variable.name) : undefined}
								deleteIcon={<AddIcon />}
							/>
						))}
					</Box>
				</Alert>
			)}

			{/* Preview */}
			{showPreview && previewText !== value && getUsedVariables().length > 0 && (
				<Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
						<PreviewIcon fontSize="small" color="primary" />
						<Typography variant="caption" color="text.secondary">
							{t('preview_with_defaults')}:
						</Typography>
					</Box>
					<Typography variant="body2" sx={{ fontStyle: 'italic' }}>
						{previewText}
					</Typography>
				</Paper>
			)}

			{/* Variable Selection Popover */}
			<Popover
				open={Boolean(anchorEl)}
				anchorEl={anchorEl}
				onClose={() => setAnchorEl(null)}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'right',
				}}
				transformOrigin={{
					vertical: 'top',
					horizontal: 'right',
				}}
			>
				<Paper sx={{ minWidth: 200, maxWidth: 300, maxHeight: 300, overflow: 'auto' }}>
					<Box sx={{ p: 1 }}>
						<Typography variant="subtitle2" gutterBottom>
							{t('select_variable')}
						</Typography>
					</Box>
					<List dense>
						{variables.map((variable) => (
							<ListItem key={variable.id} disablePadding>
								<ListItemButton onClick={() => insertVariable(variable)}>
									<ListItemText
										primary={variable.name}
										secondary={variable.description}
										primaryTypographyProps={{ variant: 'body2' }}
										secondaryTypographyProps={{ variant: 'caption' }}
									/>
								</ListItemButton>
							</ListItem>
						))}
						{variables.length === 0 && (
							<ListItem>
								<ListItemText
									primary={t('no_variables')}
									secondary={t('create_variables_first')}
									primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
									secondaryTypographyProps={{ variant: 'caption' }}
								/>
							</ListItem>
						)}
					</List>
				</Paper>
			</Popover>
		</Box>
	);
} 