
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useConnectionStatus } from '@/hooks/use-connection-status';
import { Database } from '@/integrations/supabase/types';

// Define type for pair data from Supabase
export type Pair = Database['public']['Tables']['pairs']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];

// Enhanced hook for fetching data
export function useSupabaseQuery<T>(
  tableName: string,
  query: any,
  dependencies: any[] = [],
  options: { enabled?: boolean; retries?: number; showErrors?: boolean } = { 
    enabled: true,
    retries: 1,
    showErrors: true
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEmpty, setIsEmpty] = useState<boolean>(false);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { isOffline } = useConnectionStatus();
  const [retryCount, setRetryCount] = useState(0);
  
  // Manual refetch function
  const refetch = () => {
    console.log(`🔄 Manually refetching data from ${tableName}`);
    setRetryCount(prev => prev + 1);
  };

  useEffect(() => {
    if (!options.enabled || (isAuthenticated === false && tableName !== 'public')) return;
    
    // If offline and we have data, don't refetch
    if (isOffline && data !== null) return;

    const fetchData = async () => {
      try {
        console.log(`🔍 Fetching data from ${tableName} with params:`, { dependencies, enabled: options.enabled });
        setIsLoading(true);
        setError(null);
        
        console.log(`📡 Executing Supabase query for ${tableName}`);
        const { data: result, error: queryError } = await query;
        
        console.log(`📊 ${tableName} query result:`, { result, queryError });
        
        // Special handling for PGRST116 error (no rows returned)
        if (queryError && queryError.code === 'PGRST116') {
          console.log(`ℹ️ No rows found in ${tableName}. This is expected in some cases.`);
          setIsEmpty(true);
          setData(null);
          setError(null);
          return;
        }
        
        if (queryError) throw new Error(queryError.message);
        
        // Handle empty results specially to differentiate from errors
        if (Array.isArray(result)) {
          setIsEmpty(result.length === 0);
        } else {
          setIsEmpty(result === null);
        }
        
        setData(result);
      } catch (err: any) {
        console.error(`❌ Error fetching data from ${tableName}:`, err);
        setError(err instanceof Error ? err : new Error(err.message || "Failed to fetch data"));
        
        // Only show toast if configured to do so
        if (options.showErrors) {
          // Customize error message based on error type/connectivity
          let errorMessage = "Failed to load data. ";
          
          if (isOffline) {
            errorMessage = "You're currently offline. Data can't be refreshed until you reconnect.";
          } else if (err.code === 'PGRST301') {
            errorMessage = "Your session has expired. Please sign in again.";
          } else {
            errorMessage += err.message || "Please try again later.";
          }
          
          toast({
            title: `Error fetching data`,
            description: errorMessage,
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    // Set up realtime subscription for supported tables
    if (['tasks', 'rewards', 'invites', 'pairs', 'profiles'].includes(tableName) && !isOffline) {
      console.log(`📡 Setting up realtime subscription for ${tableName}`);
      const subscription = supabase
        .channel(`${tableName}_changes`)
        .on('postgres_changes', {
          event: '*', 
          schema: 'public',
          table: tableName,
        }, (payload) => {
          console.log(`🔔 Realtime update received for ${tableName}:`, payload);
          // When data changes, refetch
          fetchData();
        })
        .subscribe();
        
      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [tableName, isAuthenticated, options.enabled, toast, isOffline, retryCount, ...dependencies]);

  return { 
    data, 
    error, 
    isLoading, 
    isEmpty, 
    refetch,
    isStale: isOffline && data !== null  // Data is stale if we're offline but have cached data
  };
}

// Hook for fetching the user's pair
export function usePair() {
  const { user, isAuthenticated } = useAuth();
  
  console.log("🔍 usePair hook called with user:", user?.id);
  
  // Use maybeSingle instead of single since the user might not be in a pair
  return useSupabaseQuery<Pair>(
    'pairs',
    supabase
      .from('pairs')
      .select('*')
      .or(`user_1_id.eq.${user?.id},user_2_id.eq.${user?.id}`)
      .maybeSingle(),
    [user?.id],
    { enabled: isAuthenticated && !!user?.id }
  );
}

// Enhanced hook for fetching the pair details
export function usePairDetails() {
  const { user, isAuthenticated } = useAuth();
  const { isOffline } = useConnectionStatus();
  
  const result = useSupabaseQuery<Database['public']['Views']['pair_details']['Row']>(
    'pair_details',
    supabase
      .from('pair_details')
      .select('*')
      .or(`user_1_id.eq.${user?.id},user_2_id.eq.${user?.id}`)
      .maybeSingle(),
    [user?.id],
    { 
      enabled: isAuthenticated && !!user?.id,
      retries: isOffline ? 0 : 2,
      showErrors: !isOffline // Only show errors when online
    }
  );
  
  // Add helper for checking if pair is complete (both users exist)
  const isPairComplete = result.data?.user_1_id && result.data?.user_2_id;
  
  return {
    ...result,
    isPairComplete,
    isPaired: isPairComplete,
    hasPendingInvite: result.data?.user_1_id && !result.data?.user_2_id
  };
}

// Hook for fetching pair points using the new DB function
export function usePairPoints(pairId?: string) {
  return useSupabaseQuery<{ total_earned: number, total_spent: number, available: number }>(
    'pair_points',
    supabase
      .rpc('get_pair_points', { pair_id: pairId })
      .single(),
    [pairId],
    { enabled: !!pairId }
  );
}

// Hook for fetching the user's profile
export function useProfile() {
  const { user, isAuthenticated } = useAuth();
  
  return useSupabaseQuery<Profile>(
    'profiles',
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single(),
    [user?.id],
    { enabled: isAuthenticated && !!user?.id }
  );
}

// Hook for fetching the user's invitations
export function useInvites() {
  const { user, isAuthenticated } = useAuth();
  
  return useSupabaseQuery<Database['public']['Tables']['invites']['Row'][]>(
    'invites',
    supabase
      .from('invites')
      .select('*')
      .eq('sender_id', user?.id)
      .is('deleted_at', null),
    [user?.id],
    { enabled: isAuthenticated && !!user?.id }
  );
}

// Hook for fetching tasks with soft delete support
export function useTasks(pairId?: string) {
  return useSupabaseQuery<Database['public']['Tables']['tasks']['Row'][]>(
    'tasks',
    supabase
      .from('tasks')
      .select('*')
      .eq('pair_id', pairId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    [pairId],
    { enabled: !!pairId }
  );
}

// Hook for fetching rewards with soft delete support
export function useRewards(pairId?: string) {
  return useSupabaseQuery<Database['public']['Tables']['rewards']['Row'][]>(
    'rewards',
    supabase
      .from('rewards')
      .select('*')
      .eq('pair_id', pairId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    [pairId],
    { enabled: !!pairId }
  );
}
