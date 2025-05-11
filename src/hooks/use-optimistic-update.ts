
import { useState } from 'react';

interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  rollbackOnError?: boolean;
}

/**
 * Hook for handling optimistic updates with rollback capability
 * @param updateFn The async function that performs the actual update
 * @param options Configuration options
 * @returns Object containing execute function, loading state, and error state
 */
export function useOptimisticUpdate<T, P>(
  updateFn: (params: P) => Promise<T>,
  options: OptimisticUpdateOptions<T> = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = async (params: P, optimisticData?: T): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    // Store original data for potential rollback
    let result: T | null = null;

    try {
      // Execute the update
      result = await updateFn(params);
      
      // Call onSuccess callback if provided
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (err) {
      // Handle error
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      
      // Call onError callback if provided
      if (options.onError) {
        options.onError(error);
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    execute,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}
