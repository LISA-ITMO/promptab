/**
 * Virtualized List component for PrompTab
 * Provides efficient rendering of large lists with virtualization
 * to improve performance and reduce memory usage
 */
import React, { useState, useCallback, useMemo } from 'react';
import { Box, List, ListItem, Skeleton } from '@mui/material';

/**
 * Props for the VirtualizedList component
 */
interface VirtualizedListProps<T> {
	/** Array of items to render */
	items: T[];
	/** Function to render each item */
	renderItem: (item: T, index: number) => React.ReactNode;
	/** Height of each item in pixels */
	itemHeight: number;
	/** Height of the container in pixels */
	containerHeight: number;
	/** Number of items to render outside the viewport */
	overscan?: number;
	/** Loading state */
	isLoading?: boolean;
	/** Loading skeleton component */
	loadingSkeleton?: React.ReactNode;
	/** Empty state component */
	emptyComponent?: React.ReactNode;
}

/**
 * VirtualizedList component for efficient rendering of large lists
 * Uses windowing technique to only render visible items
 */
export function VirtualizedList<T>({
	items,
	renderItem,
	itemHeight,
	containerHeight,
	overscan = 5,
	isLoading = false,
	loadingSkeleton,
	emptyComponent,
}: VirtualizedListProps<T>) {
	const [scrollTop, setScrollTop] = useState(0);

	// Calculate visible range
	const visibleRange = useMemo(() => {
		const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
		const endIndex = Math.min(
			items.length - 1,
			Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
		);
		return { startIndex, endIndex };
	}, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

	// Get visible items
	const visibleItems = useMemo(() => {
		return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
	}, [items, visibleRange]);

	// Calculate total height for scroll container
	const totalHeight = items.length * itemHeight;

	// Calculate offset for visible items
	const offsetY = visibleRange.startIndex * itemHeight;

	// Handle scroll events
	const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
		setScrollTop(event.currentTarget.scrollTop);
	}, []);

	// Loading state
	if (isLoading) {
		return (
			<Box sx={{ height: containerHeight, overflow: 'auto' }}>
				{loadingSkeleton || (
					<List>
						{Array.from({ length: Math.ceil(containerHeight / itemHeight) }).map((_, index) => (
							<ListItem key={index} sx={{ height: itemHeight }}>
								<Skeleton variant="rectangular" width="100%" height={itemHeight - 16} />
							</ListItem>
						))}
					</List>
				)}
			</Box>
		);
	}

	// Empty state
	if (items.length === 0) {
		return (
			<Box sx={{ height: containerHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				{emptyComponent || <div>No items found</div>}
			</Box>
		);
	}

	return (
		<Box
			sx={{
				height: containerHeight,
				overflow: 'auto',
				position: 'relative',
			}}
			onScroll={handleScroll}
		>
			{/* Invisible spacer to maintain scroll height */}
			<Box sx={{ height: totalHeight, position: 'relative' }}>
				{/* Visible items container */}
				<Box
					sx={{
						position: 'absolute',
						top: offsetY,
						left: 0,
						right: 0,
					}}
				>
					{visibleItems.map((item, index) => (
						<Box
							key={visibleRange.startIndex + index}
							sx={{
								height: itemHeight,
								overflow: 'hidden',
							}}
						>
							{renderItem(item, visibleRange.startIndex + index)}
						</Box>
					))}
				</Box>
			</Box>
		</Box>
	);
}

/**
 * Hook for managing virtualized list state
 * @param items - Array of items
 * @param itemHeight - Height of each item
 * @param containerHeight - Height of container
 * @returns Virtualized list state and handlers
 */
export function useVirtualizedList<T>(
	items: T[],
	itemHeight: number,
	containerHeight: number
) {
	const [scrollTop, setScrollTop] = useState(0);

	const visibleRange = useMemo(() => {
		const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight));
		const endIndex = Math.min(
			items.length - 1,
			Math.ceil((scrollTop + containerHeight) / itemHeight)
		);
		return { startIndex, endIndex };
	}, [scrollTop, itemHeight, containerHeight, items.length]);

	const visibleItems = useMemo(() => {
		return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
	}, [items, visibleRange]);

	const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
		setScrollTop(event.currentTarget.scrollTop);
	}, []);

	return {
		scrollTop,
		visibleRange,
		visibleItems,
		handleScroll,
		totalHeight: items.length * itemHeight,
		offsetY: visibleRange.startIndex * itemHeight,
	};
} 