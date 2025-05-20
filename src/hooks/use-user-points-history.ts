// Fix the TypeScript errors related to possibly null item.task and item.reward
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PointHistoryItem {
  id: string;
  type: 'task_completion' | 'reward_claim' | 'unknown';
  description: string;
  points: number;
  timestamp: Date;
  date: string;
}

interface DatabasePointHistoryItem {
  id: string;
  created_at: string;
  user_id: string;
  amount: number;
  source_type: string;
  task: { description: string } | null;
  reward: { description: string } | null;
}

const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Add a function to check if an item has an error property
function hasErrorProperty(obj: any): obj is { error: string } {
  return obj && typeof obj === 'object' && 'error' in obj;
}

export function useUserPointsHistory() {
  const [history, setHistory] = useState<PointHistoryItem[]>([]);
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

        const { data: historyData, error: historyError } = await supabase
          .from('user_points_history')
          .select(`
            id,
            created_at,
            user_id,
            amount,
            source_type,
            task:task_id ( description ),
            reward:reward_id ( description )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (historyError) throw historyError;

        if (historyData) {
          const processedItems = historyData.map(item => {
            const timestamp = new Date(item.created_at);
            
            // For task completions
            if (item.source_type === 'task') {
              // Check if task exists and is a proper object and not an error
              if (item.task && typeof item.task === 'object' && !hasErrorProperty(item.task)) {
                const description = item.task?.description;
                
                if (description) {
                  return {
                    id: item.id,
                    type: 'task_completion',
                    description: description,
                    points: item.amount,
                    timestamp,
                    date: formatDate(timestamp),
                  };
                }
              }
              
              // Fallback if task data is not available
              return {
                id: item.id,
                type: 'task_completion',
                description: 'Task completion',
                points: item.amount,
                timestamp,
                date: formatDate(timestamp),
              };
            }
            
            // For reward claims
            if (item.source_type === 'reward') {
              // Check if reward exists and is a proper object and not an error
              if (item.reward && typeof item.reward === 'object' && !hasErrorProperty(item.reward)) {
                const description = item.reward?.description;
                
                if (description) {
                  return {
                    id: item.id,
                    type: 'reward_claim',
                    description: description,
                    points: item.amount, // Negative value
                    timestamp,
                    date: formatDate(timestamp),
                  };
                }
              }
              
              // Fallback if reward data is not available
              return {
                id: item.id,
                type: 'reward_claim',
                description: 'Reward claim',
                points: item.amount,
                timestamp,
                date: formatDate(timestamp),
              };
            }
            
            // For unknown types
            return {
              id: item.id,
              type: 'unknown',
              description: `Point change (${item.source_type})`,
              points: item.amount,
              timestamp,
              date: formatDate(timestamp),
            };
          });

          setHistory(processedItems);
        }
      } catch (err: any) {
        console.error('Error fetching user points history:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchPointsHistory();

    // Set up realtime subscription for history changes (optional)
    const channel = supabase
      .channel('user_points_history_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_points_history',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        console.log('Change received!', payload);
        fetchPointsHistory();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  return { history, loading, error };
}
