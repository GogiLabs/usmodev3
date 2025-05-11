
import { supabase } from "@/integrations/supabase/client";
import { Task, TaskTag } from "@/types/Task";
import { useSoftDelete } from "@/hooks/use-soft-delete";
import { useToast } from "@/components/ui/use-toast";

// Convert database task to app task format
export const mapDbTaskToAppTask = (dbTask: any): Task => {
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

// Convert app task to database format for insertion
export const mapAppTaskToDbTask = (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'completedAt'>, pairId: string) => {
  return {
    description: task.description,
    points: task.points,
    tag: task.tag,
    pair_id: pairId,
    completed: false,
  };
};

export const useTaskService = (pairId?: string) => {
  const { softDelete } = useSoftDelete();
  const { toast } = useToast();

  const createTask = async (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'completedAt'>) => {
    if (!pairId) {
      throw new Error("Cannot create task: No pair ID");
    }

    try {
      const dbTask = mapAppTaskToDbTask(task, pairId);
      const { data, error } = await supabase.from('tasks').insert(dbTask).select().single();
      
      if (error) throw error;
      return mapDbTaskToAppTask(data);
    } catch (error: any) {
      console.error("Error creating task:", error);
      toast({
        title: "Error creating task",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const completeTask = async (taskId: string, userId: string) => {
    try {
      const { data, error } = await supabase.from('tasks')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
          completed_by: userId
        })
        .eq('id', taskId)
        .select()
        .single();
      
      if (error) throw error;
      return mapDbTaskToAppTask(data);
    } catch (error: any) {
      console.error("Error completing task:", error);
      toast({
        title: "Error completing task",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await softDelete('tasks', taskId);
    } catch (error: any) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error deleting task",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    createTask,
    completeTask,
    deleteTask,
  };
};
