/**
 * PromptDisplay component for PrompTab
 * Displays optimized prompt results with interactive features and platform integration
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	Box,
	Paper,
	Typography,
	IconButton,
	Tooltip,
	Chip,
	Collapse,
	Button,

	List,
	ListItem,
	ListItemText,
	ListItemIcon,
	Alert,
} from '@mui/material';
import {
	ContentCopy as CopyIcon,

	ExpandMore as ExpandMoreIcon,
	ExpandLess as ExpandLessIcon,
	Source as SourceIcon,
	Psychology as PsychologyIcon,
	Code as VariableIcon,
	Save as SaveIcon,
	ChatBubble as ChatGPTIcon,
	Search as PerplexityIcon,
} from '@mui/icons-material';

import { OptimizeResponse } from '@services/api';

/**
 * Props for the PromptDisplay component
 */
interface PromptDisplayProps {
	/** Optimization result to display */
	result: OptimizeResponse;
	/** Callback for copying text to clipboard */
	onCopy: (text: string) => void;
	/** Callback for sending prompt to ChatGPT */
	onSendToChatGPT: () => void;
	/** Callback for sending prompt to Perplexity */
	onSendToPerplexity: () => void;
	/** Optional callback for saving the prompt */
	onSave?: () => void;
	/** Optional callback for creating variables from selected text */
	onCreateVariable?: (text: string) => void;
}

/**
 * Component for displaying optimized prompt results
 * Provides interactive features like copying, saving, and platform integration
 * @param props - PromptDisplay properties
 * @returns JSX element
 */
export function PromptDisplay({
	result,
	onCopy,
	onSendToChatGPT,
	onSendToPerplexity,
	onSave,
	onCreateVariable,
}: PromptDisplayProps) {
	const { t } = useTranslation();
	const [showStructure, setShowStructure] = useState(false);
	const [showSources, setShowSources] = useState(false);
	const [showVariables, setShowVariables] = useState(false);

	/**
	 * Handle text selection for variable creation
	 * Creates variables from selected text when onCreateVariable is available
	 */
	const handleTextSelection = () => {
		const selection = window.getSelection();
		const selectedText = selection?.toString().trim();

		if (selectedText && selectedText.length > 3 && onCreateVariable) {
			onCreateVariable(selectedText);
		}
	};

	/**
	 * Structure items for displaying prompt breakdown
	 */
	const structureItems = [
		{ key: 'role', label: t('role'), value: result.structure.role },
		{ key: 'task', label: t('task'), value: result.structure.task },
		{ key: 'context', label: t('context'), value: result.structure.context },
		{ key: 'instructions', label: t('instructions'), value: result.structure.instructions },
		{ key: 'constraints', label: t('constraints'), value: result.structure.constraints },
		{ key: 'tone', label: t('tone'), value: result.structure.tone },
	];

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
			{/* Optimized Prompt */}
			<Paper sx={{ p: 2 }}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
					<Typography variant="h6" component="h3">
						{t('optimized_prompt')}
					</Typography>
					<Box sx={{ display: 'flex', gap: 0.5 }}>
						<Tooltip title={t('copy')}>
							<IconButton
								size="small"
								onClick={() => onCopy(result.optimized)}
							>
								<CopyIcon />
							</IconButton>
						</Tooltip>
						{onSave && (
							<Tooltip title={t('save')}>
								<IconButton size="small" onClick={onSave}>
									<SaveIcon />
								</IconButton>
							</Tooltip>
						)}
					</Box>
				</Box>

				<Box
					sx={{
						maxHeight: 200,
						overflow: 'auto',
						border: 1,
						borderColor: 'divider',
						borderRadius: 1,
						p: 1.5,
						fontSize: '0.875rem',
						lineHeight: 1.5,
						fontFamily: 'monospace',
						backgroundColor: 'grey.50',
						cursor: 'text',
					}}
					onMouseUp={handleTextSelection}
				>
					{result.optimized}
				</Box>

				{/* Quick Actions */}
				<Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
					<Button
						variant="contained"
						size="small"
						startIcon={<ChatGPTIcon />}
						onClick={onSendToChatGPT}
						sx={{
							backgroundColor: '#10A37F',
							'&:hover': { backgroundColor: '#0d8c6c' }
						}}
					>
						ChatGPT
					</Button>
					<Button
						variant="contained"
						size="small"
						startIcon={<PerplexityIcon />}
						onClick={onSendToPerplexity}
						sx={{
							backgroundColor: '#1C1C1C',
							'&:hover': { backgroundColor: '#2c2c2c' }
						}}
					>
						Perplexity
					</Button>
				</Box>
			</Paper>

			{/* Techniques Used */}
			{result.techniques_used.length > 0 && (
				<Paper sx={{ p: 2 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
						<PsychologyIcon color="primary" />
						<Typography variant="subtitle2">
							{t('techniques_used')}
						</Typography>
					</Box>
					<Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
						{result.techniques_used.map((technique, index) => (
							<Chip
								key={index}
								label={technique}
								size="small"
								variant="outlined"
								color="primary"
							/>
						))}
					</Box>
				</Paper>
			)}

			{/* Variables */}
			{result.variables && result.variables.length > 0 && (
				<Paper sx={{ p: 2 }}>
					<Button
						fullWidth
						variant="text"
						startIcon={<VariableIcon />}
						endIcon={showVariables ? <ExpandLessIcon /> : <ExpandMoreIcon />}
						onClick={() => setShowVariables(!showVariables)}
						sx={{ justifyContent: 'space-between', textTransform: 'none' }}
					>
						<Typography variant="subtitle2">
							{t('suggested_variables')} ({result.variables.length})
						</Typography>
					</Button>
					<Collapse in={showVariables}>
						<Box sx={{ mt: 1 }}>
							<Alert severity="info" sx={{ mb: 1 }}>
								{t('variables_help')}
							</Alert>
							{result.variables.map((variable, index) => (
								<Box key={index} sx={{ mb: 1, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
									<Typography variant="body2" fontWeight="medium">
										{variable.suggested_name} ({variable.type})
									</Typography>
									<Typography variant="caption" color="text.secondary">
										"{variable.text}"
									</Typography>
									{onCreateVariable && (
										<Button
											size="small"
											onClick={() => onCreateVariable(variable.text)}
											sx={{ mt: 0.5 }}
										>
											{t('create_variable')}
										</Button>
									)}
								</Box>
							))}
						</Box>
					</Collapse>
				</Paper>
			)}

			{/* Prompt Structure */}
			<Paper sx={{ p: 2 }}>
				<Button
					fullWidth
					variant="text"
					startIcon={<PsychologyIcon />}
					endIcon={showStructure ? <ExpandLessIcon /> : <ExpandMoreIcon />}
					onClick={() => setShowStructure(!showStructure)}
					sx={{ justifyContent: 'space-between', textTransform: 'none' }}
				>
					<Typography variant="subtitle2">
						{t('prompt_structure')}
					</Typography>
				</Button>
				<Collapse in={showStructure}>
					<List dense sx={{ mt: 1 }}>
						{structureItems.map((item) => (
							<ListItem key={item.key} sx={{ px: 0 }}>
								<ListItemText
									primary={item.label}
									secondary={item.value || t('not_specified')}
									primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
									secondaryTypographyProps={{ variant: 'caption' }}
								/>
							</ListItem>
						))}
					</List>
				</Collapse>
			</Paper>

			{/* RAG Sources */}
			{result.rag_sources && result.rag_sources.length > 0 && (
				<Paper sx={{ p: 2 }}>
					<Button
						fullWidth
						variant="text"
						startIcon={<SourceIcon />}
						endIcon={showSources ? <ExpandLessIcon /> : <ExpandMoreIcon />}
						onClick={() => setShowSources(!showSources)}
						sx={{ justifyContent: 'space-between', textTransform: 'none' }}
					>
						<Typography variant="subtitle2">
							{t('knowledge_sources')} ({result.rag_sources.length})
						</Typography>
					</Button>
					<Collapse in={showSources}>
						<List dense sx={{ mt: 1 }}>
							{result.rag_sources.map((source, index) => (
								<ListItem key={index} sx={{ px: 0, alignItems: 'flex-start' }}>
									<ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
										<SourceIcon fontSize="small" />
									</ListItemIcon>
									<ListItemText
										primary={source.title}
										secondary={
											<>
												<Typography variant="caption" display="block">
													{t('similarity')}: {(source.similarity * 100).toFixed(1)}%
												</Typography>
												<Typography variant="caption" color="text.secondary">
													{source.content.substring(0, 150)}...
												</Typography>
											</>
										}
										primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
									/>
								</ListItem>
							))}
						</List>
					</Collapse>
				</Paper>
			)}
		</Box>
	);
} 