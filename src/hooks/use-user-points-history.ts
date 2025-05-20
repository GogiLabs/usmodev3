
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PointHistoryItem {
  id: string;
  type: 'task_completion' | 'reward_claim' | 'unknown';
  description: string;
  points: number;
  timestamp: Date;
  date: string;
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

        // Query user_points table instead of non-existent user_points_history table
        const { data: pointsData, error: pointsError } = await supabase
          .from('user_points')
          .select(`
            id,
            amount,
            source_type,
            source_id,
            created_at,
            task:tasks!source_id(description),
            reward:rewards!source_id(description)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (pointsError) throw pointsError;

        if (pointsData) {
          const processedItems: PointHistoryItem[] = pointsData.map(item => {
            const timestamp = new Date(item.created_at);
            
            // For task completions
            if (item.source_type === 'task') {
              // Check if task exists and has description
              const taskDescription = item.task && 
                typeof item.task === 'object' && 
                !hasErrorProperty(item.task) && 
                item.task.description ? 
                item.task.description : 
                'Task completion';
              
              return {
                id: item.id,
                type: 'task_completion',
                description: taskDescription,
                points: item.amount,
                timestamp,
                date: formatDate(timestamp),
              };
            }
            
            // For reward claims
            if (item.source_type === 'reward') {
              // Check if reward exists and has description
              const rewardDescription = item.reward && 
                typeof item.reward === 'object' && 
                !hasErrorProperty(item.reward) && 
                item.reward.description ? 
                item.reward.description : 
                'Reward claim';
              
              return {
                id: item.id,
                type: 'reward_claim',
                description: rewardDescription,
                points: item.amount, // Negative value
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
    
    // Set up realtime subscription for history changes
    const channel = supabase
      .channel('user_points_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_points',
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
