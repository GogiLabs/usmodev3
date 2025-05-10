
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Database } from '@/integrations/supabase/types';

// Define type for pair data from Supabase
export type Pair = Database['public']['Tables']['pairs']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];

// Generic hook for fetching data
export function useSupabaseQuery<T>(
  tableName: string,
  query: any,
  dependencies: any[] = [],
  options: { enabled?: boolean } = { enabled: true }
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!options.enabled || !isAuthenticated) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const { data: result, error: queryError } = await query;
        
        if (queryError) throw new Error(queryError.message);
        
        setData(result);
        setError(null);
      } catch (err: any) {
        console.error(`Error fetching data from ${tableName}:`, err);
        setError(err);
        toast({
          title: `Error fetching data`,
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    // Set up realtime subscription for supported tables
    if (['tasks', 'rewards', 'invites'].includes(tableName)) {
      const subscription = supabase
        .channel(`${tableName}_changes`)
        .on('postgres_changes', {
          event: '*', 
          schema: 'public',
          table: tableName,
        }, () => {
          // When data changes, refetch
          fetchData();
        })
        .subscribe();
        
      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [tableName, isAuthenticated, options.enabled, toast, ...dependencies]);

  return { data, error, isLoading };
}

// Hook for fetching the user's pair
export function usePair() {
  const { user, isAuthenticated } = useAuth();
  
  return useSupabaseQuery<Pair>(
    'pairs',
    supabase
      .from('pairs')
      .select('*')
      .or(`user_1_id.eq.${user?.id},user_2_id.eq.${user?.id}`)
      .single(),
    [user?.id],
    { enabled: isAuthenticated && !!user?.id }
  );
}

// Hook for fetching the pair details (including partner profile)
export function usePairDetails() {
  const { user, isAuthenticated } = useAuth();
  
  return useSupabaseQuery<Database['public']['Views']['pair_details']['Row']>(
    'pair_details',
    supabase
      .from('pair_details')
      .select('*')
      .or(`user_1_id.eq.${user?.id},user_2_id.eq.${user?.id}`)
      .single(),
    [user?.id],
    { enabled: isAuthenticated && !!user?.id }
  );
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
