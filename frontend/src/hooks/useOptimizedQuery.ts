/**
 * Optimized query hook for PrompTab
 * Provides enhanced caching, error handling, and performance optimizations
 * for API requests with automatic retry and stale-while-revalidate patterns
 */
import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';

/**
 * Enhanced query options with PrompTab-specific optimizations
 */
interface OptimizedQueryOptions<TData, TError = AxiosError> extends Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> {
	/** Whether to enable optimistic updates */
	optimistic?: boolean;
	/** Custom retry delay in milliseconds */
	retryDelay?: number;
	/** Whether to show loading states */
	showLoading?: boolean;
	/** Cache time in milliseconds */
	gcTime?: number;
	/** Stale time in milliseconds */
	staleTime?: number;
}

/**
 * Optimized query hook with enhanced caching and error handling
 * @param queryKey - Unique key for the query
 * @param queryFn - Function to fetch data
 * @param options - Query options
 * @returns Query result with enhanced features
 */
export function useOptimizedQuery<TData, TError = AxiosError>(
	queryKey: string[],
	queryFn: () => Promise<TData>,
	options: OptimizedQueryOptions<TData, TError> = {}
): UseQueryResult<TData, TError> {
	const {
		optimistic = false,
		retryDelay = 1000,
		showLoading = true,
		gcTime = 5 * 60 * 1000, // 5 minutes
		staleTime = 2 * 60 * 1000, // 2 minutes
		...queryOptions
	} = options;

	return useQuery({
		queryKey,
		queryFn,
		// Enhanced caching strategy
		gcTime,
		staleTime,
		// Optimized retry strategy
		retry: (failureCount, error: TError) => {
			// Don't retry on 4xx errors (client errors)
			if (error instanceof AxiosError && error.response?.status && error.response.status >= 400 && error.response.status < 500) {
				return false;
			}
			// Retry up to 3 times for server errors
			return failureCount < 3;
		},
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, retryDelay),
		// Optimized refetching
		refetchOnWindowFocus: false,
		refetchOnReconnect: true,
		refetchOnMount: true,
		// Enhanced loading states
		notifyOnChangeProps: showLoading ? undefined : ['data', 'error'],
		...queryOptions,
	});
}

/**
 * Hook for queries that should be cached aggressively
 * @param queryKey - Unique key for the query
 * @param queryFn - Function to fetch data
 * @param options - Query options
 * @returns Query result with aggressive caching
 */
export function useCachedQuery<TData, TError = AxiosError>(
	queryKey: string[],
	queryFn: () => Promise<TData>,
	options: OptimizedQueryOptions<TData, TError> = {}
): UseQueryResult<TData, TError> {
	return useOptimizedQuery(queryKey, queryFn, {
		...options,
		gcTime: 10 * 60 * 1000, // 10 minutes
		staleTime: 5 * 60 * 1000, // 5 minutes
		refetchOnMount: false,
		refetchOnWindowFocus: false,
	});
}

/**
 * Hook for queries that should be fresh (no caching)
 * @param queryKey - Unique key for the query
 * @param queryFn - Function to fetch data
 * @param options - Query options
 * @returns Query result with no caching
 */
export function useFreshQuery<TData, TError = AxiosError>(
	queryKey: string[],
	queryFn: () => Promise<TData>,
	options: OptimizedQueryOptions<TData, TError> = {}
): UseQueryResult<TData, TError> {
	return useOptimizedQuery(queryKey, queryFn, {
		...options,
		gcTime: 0,
		staleTime: 0,
		refetchOnMount: true,
		refetchOnWindowFocus: true,
	});
} 