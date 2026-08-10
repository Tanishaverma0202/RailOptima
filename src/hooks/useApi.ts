import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiError, PaginatedResponse } from '@/utils/api';

// Generic API hook options
interface UseApiOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
  retry?: number;
  retryDelay?: number;
}

// Generic API hook return type
interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  execute: () => Promise<void>;
  reset: () => void;
  refetch: () => Promise<void>;
}

// Generic API hook
export function useApi<T = any>(
  apiCall: () => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiReturn<T> {
  const {
    immediate = true,
    onSuccess,
    onError,
    retry = 0,
    retryDelay = 1000,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);

  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiCall();
      
      if (mountedRef.current) {
        setData(result);
        onSuccess?.(result);
        retryCountRef.current = 0;
      }
    } catch (err) {
      if (!mountedRef.current) return;
      
      const apiError = err instanceof ApiError ? err : new ApiError('An error occurred');
      setError(apiError);
      onError?.(apiError);
      
      // Retry logic
      if (retryCountRef.current < retry) {
        retryCountRef.current++;
        setTimeout(() => execute(), retryDelay * retryCountRef.current);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiCall, onSuccess, onError, retry, retryDelay]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
    retryCountRef.current = 0;
  }, []);

  const refetch = useCallback(() => {
    retryCountRef.current = 0;
    return execute();
  }, [execute]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    refetch,
  };
}

// Pagination hook
export function usePagination<T>(
  fetchPage: (page: number, limit: number) => Promise<PaginatedResponse<T>>,
  initialPage = 1,
  initialLimit = 10
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchPageData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchPage(page, limit);
      
      if (response.success && response.data) {
        setData(response.data);
        if (response.pagination) {
          setTotal(response.pagination.total);
          setTotalPages(response.pagination.totalPages);
        }
      }
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError('Failed to fetch data'));
    } finally {
      setLoading(false);
    }
  }, [fetchPage, page, limit]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const nextPage = useCallback(() => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  }, [page, totalPages]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  const changeLimit = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing limit
  }, []);

  return {
    data,
    loading,
    error,
    page,
    limit,
    total,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
    changeLimit,
    refetch: fetchPageData,
  };
}

// Infinite scroll hook
export function useInfiniteScroll<T>(
  fetchMore: (page: number, limit: number) => Promise<PaginatedResponse<T>>,
  initialLimit = 20
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = initialLimit;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchMore(page, limit);
      
      if (response.success && response.data) {
        setData(prev => [...prev, ...(response.data || [])]);
        
        // Check if there's more data
        if (response.data.length < limit) {
          setHasMore(false);
        }
        
        setPage(prev => prev + 1);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError('Failed to load more data'));
    } finally {
      setLoading(false);
    }
  }, [fetchMore, page, limit, loading, hasMore]);

  const reset = useCallback(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMore();
  }, []);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
  };
}

// Mutation hook
export function useMutation<T, P = any>(
  mutationFn: (params: P) => Promise<T>,
  options: UseApiOptions<T> = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const mutate = useCallback(async (params: P) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await mutationFn(params);
      setData(result);
      options.onSuccess?.(result);
      
      return result;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError('Mutation failed');
      setError(apiError);
      options.onError?.(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, [mutationFn, options]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    mutate,
    reset,
  };
}

// Debounced API hook
export function useDebouncedApi<T>(
  apiCall: () => Promise<T>,
  delay = 300,
  options: UseApiOptions<T> = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  
  const timeoutRef = useRef<any>(null);
  const mountedRef = useRef(true);

  const execute = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await apiCall();
        
        if (mountedRef.current) {
          setData(result);
          options.onSuccess?.(result);
        }
      } catch (err) {
        if (!mountedRef.current) return;
        
        const apiError = err instanceof ApiError ? err : new ApiError('An error occurred');
        setError(apiError);
        options.onError?.(apiError);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    }, delay);
  }, [apiCall, delay, options]);

  useEffect(() => {
    execute();
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      mountedRef.current = false;
    };
  }, [execute]);

  return {
    data,
    loading,
    error,
    execute,
  };
}

export default useApi;
