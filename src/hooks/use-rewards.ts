
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useRewards(pairId?: string) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !pairId) {
      setData([]);
      setIsLoading(false);
      return;
    }

    const fetchRewards = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('rewards')
          .select('*')
          .eq('pair_id', pairId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setData(data || []);
      } catch (err) {
        console.error('Error fetching rewards:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRewards();

    // Set up realtime subscription with improved filtering
    const channel = supabase
      .channel('rewards_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'rewards',
        filter: `pair_id=eq.${pairId}`
      }, (payload) => {
        console.log('Rewards real-time update received:', payload);
        fetchRewards(); // Refresh the rewards immediately
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, pairId]);

  const refetch = async () => {
    if (!user || !pairId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('pair_id', pairId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(data || []);
    } catch (err) {
      console.error('Error refetching rewards:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, refetch };
}
