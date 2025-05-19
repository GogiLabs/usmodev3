
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
  } | null;
  reward?: {
    description: string;
  } | null;
}

// Type guard to check if the data has an error property
function hasErrorProperty(obj: any): boolean {
  return obj && typeof obj === 'object' && 'error' in obj;
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
        
        // Get user points history from the user_points table
        const { data, error } = await supabase
          .from('user_points')
          .select(`
            id,
            amount,
            source_type,
            source_id,
            created_at,
            task:tasks(description),
            reward:rewards(description)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Process and validate the data to match our expected types
        const typedData: PointsHistoryItem[] = (data || []).map(item => {
          // Initialize task and reward as undefined
          let taskData: { description: string } | null = null;
          let rewardData: { description: string } | null = null;

          // For task data, check if it exists and isn't an error
          if (typeof item.task === 'object' && !hasErrorProperty(item.task) && item.task) {
            // Safe to access description now
            //const description = item.task.description;
            if (typeof item.task.description === 'string') {
              taskData = { description };
            }
          }

          // For reward data, check if it exists and isn't an error
          if (typeof item.reward === 'object' && !hasErrorProperty(item.reward) && item.reward) {
            // Safe to access description now
            const description = item.reward.description;
            if (typeof description === 'string') {
              rewardData = { description };
            }
          }
          
          return {
            id: item.id,
            amount: item.amount,
            source_type: item.source_type as 'task' | 'reward',
            source_id: item.source_id,
            created_at: item.created_at,
            task: taskData,
            reward: rewardData
          };
        });
        
        setHistory(typedData);
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
