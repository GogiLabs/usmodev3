
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePairStatus } from "@/hooks/use-pair-status";
import { Task, TaskTag } from "@/types/Task";

// Helper function to map database task to app task model
const mapDbTaskToAppTask = (dbTask: any): Task => {
  return {
    id: dbTask.id,
    description: dbTask.description,
    points: dbTask.points,
    tag: dbTask.tag as TaskTag,
    completed: dbTask.completed,
    createdAt: new Date(dbTask.created_at),
    completedAt: dbTask.completed_at ? new Date(dbTask.completed_at) : undefined,
    completedBy: dbTask.completed_by,
  };
};

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { isPaired, pairData } = usePairStatus();

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const fetchTasks = async () => {
      try {
        setLoading(true);
        
        let query = supabase
          .from('tasks')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false });
        
        // If paired, filter by pair_id
        if (isPaired && pairData) {
          query = query.eq('pair_id', pairData.pair_id);
        } else {
          // If not paired, get tasks created by this user
          // This is a fallback to show individual tasks when not paired
          const { data: userPairs } = await supabase
            .from('pairs')
            .select('id')
            .eq('user_1_id', user.id)
            .is('user_2_id', null)
            .limit(1);
            
          if (userPairs && userPairs.length > 0) {
            query = query.eq('pair_id', userPairs[0].id);
          }
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Transform database tasks to app tasks
        setTasks((data || []).map(mapDbTaskToAppTask));
      } catch (err: any) {
        console.error('Error fetching tasks:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
    
    // Set up realtime subscription
    const subscription = supabase
      .channel('tasks_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tasks',
        filter: isPaired && pairData ? `pair_id=eq.${pairData.pair_id}` : undefined
      }, () => {
        fetchTasks();
      })
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [user, isPaired, pairData]);
  
  return { tasks, loading, error };
}
