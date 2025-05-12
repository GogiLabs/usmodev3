
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { toast as sonnerToast } from 'sonner';
import { useConnectionStatus } from '@/hooks/use-connection-status';

type SupabaseErrorHandlerOptions = {
  showToasts?: boolean;
  showSonner?: boolean;
  errorPrefix?: string;
  retryable?: boolean;
};

// This hook provides consistent error handling for Supabase operations
export function useSupabaseError() {
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { isOffline } = useConnectionStatus();
  
  // Function to handle errors in a consistent way
  const handleError = (
    error: any, 
    options: SupabaseErrorHandlerOptions = {
      showToasts: true,
      showSonner: false,
      errorPrefix: 'Operation failed',
      retryable: false
    }
  ) => {
    const { showToasts, showSonner, errorPrefix, retryable } = options;
    
    // Format the error message
    let errorMessage = error?.message || 'An unexpected error occurred';
    
    // Special handling for offline errors
    if (isOffline) {
      errorMessage = 'You are offline. Please check your connection and try again.';
    }
    
    // Special handling for common Supabase errors
    if (error?.code === 'PGRST301') {
      errorMessage = 'Your session has expired. Please sign in again.';
    } else if (error?.code === '23505') {
      errorMessage = 'A record with this information already exists.';
    } else if (error?.code === '42501') {
      errorMessage = 'You do not have permission to perform this action.';
    } else if (error?.code === '23503') {
      errorMessage = 'This operation failed due to a reference constraint.';
    }
    
    // Set the state error
    setError(error instanceof Error ? error : new Error(errorMessage));
    
    // Show appropriate UI notifications
    if (showToasts) {
      toast({
        title: errorPrefix,
        description: errorMessage,
        variant: "destructive",
      });
    }
    
    if (showSonner) {
      sonnerToast.error(errorPrefix, {
        description: errorMessage,
        action: retryable ? {
          label: 'Retry',
          onClick: () => window.location.reload()
        } : undefined
      });
    }
    
    // Return the error for further handling
    return error;
  };
  
  // Function to wrap async Supabase operations
  const withErrorHandling = async <T>(
    operation: () => Promise<T>, 
    options?: SupabaseErrorHandlerOptions
  ): Promise<T | null> => {
    try {
      setError(null);
      return await operation();
    } catch (err) {
      handleError(err, options);
      return null;
    }
  };
  
  return { 
    error, 
    setError,
    handleError, 
    withErrorHandling,
    clearError: () => setError(null)
  };
}
