import { useState, useCallback, useEffect } from 'react';
import { ApiService, ApiResponse } from '../services/api';

/**
 * Hook for using the API service in React components
 */
export function useApi<T>(
  apiService: ApiService,
  method: keyof ApiService,
  ...args: any[]
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (...callArgs: any[]) => {
    try {
      setLoading(true);
      setError(null);

      // Use provided args or default args
      const argsToUse = callArgs.length > 0 ? callArgs : args;

      // Call the API method
      const response = await (apiService[method] as (...args: any[]) => Promise<ApiResponse<T>>)(...argsToUse);

      if (response.error) {
        setError(response.error);
        setData(null);
      } else {
        setData(response.data as T);
      }

      return response;
    } catch (err) {
      setError(err.message || 'An unknown error occurred');
      setData(null);
      return {
        error: err.message,
        status: 500
      };
    } finally {
      setLoading(false);
    }
  }, [apiService, method, ...args]);

  return {
    data,
    loading,
    error,
    execute
  };
}

/**
 * Hook for making an API call on component mount
 */
export function useApiOnMount<T>(
  apiService: ApiService,
  method: keyof ApiService,
  ...args: any[]
) {
  const { data, loading, error, execute } = useApi<T>(apiService, method, ...args);

  useEffect(() => {
    execute();
  }, [execute]);

  return {
    data,
    loading,
    error,
    refetch: execute
  };
}

export default useApi;
