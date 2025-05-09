
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
      .eq('sender_id', user?.id),
    [user?.id],
    { enabled: isAuthenticated && !!user?.id }
  );
}
