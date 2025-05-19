
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PointsHistoryItem {
  id: string;
  amount: number;
  source_type: 'task' | 'reward';
  source_id: string;
  created_at: string;
  task?: {
    description: string;
  };
  reward?: {
    description: string;
  };
}

export function useUserPointsHistory() {
  const [history, setHistory] = useState<PointsHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setHistory([]);
      setLoading(false);
      return;
    }

    const fetchPointsHistory = async () => {
      try {
        setLoading(true);
        
        // Get user points history with related task/reward info
        const { data, error } = await supabase
          .from('user_points')
          .select(`
            *,
            task:tasks!inner(description),
            reward:rewards!inner(description)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setHistory(data || []);
      } catch (err: any) {
        console.error('Error fetching points history:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };
    
    fetchPointsHistory();
    
    // Set up subscription for points history updates
    const channel = supabase
      .channel('user_points_history')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'user_points',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchPointsHistory();
      })
      .subscribe();
    
    return () => {
      channel.unsubscribe();
    };
  }, [user]);
  
  return { history, loading, error };
}
