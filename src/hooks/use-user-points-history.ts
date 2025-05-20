
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

// Type guard to check if a value is a non-null object
function isNonNullObject(value: any): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
            created_at
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (pointsError) throw pointsError;

        // Fetch related task and reward data separately to avoid relation errors
        const processedItems: PointHistoryItem[] = [];
        
        if (pointsData) {
          // Create a map to store task descriptions
          const taskIds = pointsData
            .filter(item => item.source_type === 'task')
            .map(item => item.source_id);
          
          const rewardIds = pointsData
            .filter(item => item.source_type === 'reward')
            .map(item => item.source_id);
          
          // Fetch task descriptions if needed
          let taskDescriptions: Record<string, string> = {};
          if (taskIds.length > 0) {
            const { data: tasksData } = await supabase
              .from('tasks')
              .select('id, description')
              .in('id', taskIds);
              
            if (tasksData) {
              taskDescriptions = tasksData.reduce((acc, task) => ({
                ...acc,
                [task.id]: task.description
              }), {});
            }
          }
          
          // Fetch reward descriptions if needed
          let rewardDescriptions: Record<string, string> = {};
          if (rewardIds.length > 0) {
            const { data: rewardsData } = await supabase
              .from('rewards')
              .select('id, description')
              .in('id', rewardIds);
              
            if (rewardsData) {
              rewardDescriptions = rewardsData.reduce((acc, reward) => ({
                ...acc,
                [reward.id]: reward.description
              }), {});
            }
          }
          
          // Process all items with the descriptions we've fetched
          for (const item of pointsData) {
            const timestamp = new Date(item.created_at);
            
            if (item.source_type === 'task') {
              const taskDescription = taskDescriptions[item.source_id] || 'Task completion';
              processedItems.push({
                id: item.id,
                type: 'task_completion',
                description: taskDescription,
                points: item.amount,
                timestamp,
                date: formatDate(timestamp),
              });
            } else if (item.source_type === 'reward') {
              const rewardDescription = rewardDescriptions[item.source_id] || 'Reward claim';
              processedItems.push({
                id: item.id,
                type: 'reward_claim',
                description: rewardDescription,
                points: item.amount,
                timestamp,
                date: formatDate(timestamp),
              });
            } else {
              processedItems.push({
                id: item.id,
                type: 'unknown',
                description: `Point change (${item.source_type})`,
                points: item.amount,
                timestamp,
                date: formatDate(timestamp),
              });
            }
          }
        }

        setHistory(processedItems);
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
