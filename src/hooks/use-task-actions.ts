
import { useCallback } from 'react';
import { createTaskWithDefaults } from '@/contexts/task/taskUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskService } from '@/services/taskService';
import { usePairStatus } from '@/hooks/use-pair-status';
import { useToast } from '@/components/ui/use-toast';
import { toast as sonnerToast } from 'sonner';
import { Task } from '@/types/Task';
import { useUserPoints } from '@/hooks/use-user-points';

/**
 * Hook for task CRUD operations
 */
export function useTaskActions(dispatch: React.Dispatch<any>) {
  const { isAuthenticated, user, showAuthRequiredToast } = useAuth();
  const { isPaired, pairData } = usePairStatus();
  const { toast } = useToast();
  const { refetch: refetchPoints } = useUserPoints();
  const taskService = useTaskService(pairData?.pair_id, refetchPoints);

  // Function to add a new task
  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'completedAt'>) => {
    console.log('➕ Adding new task:', taskData);
    
    // Validate task data
    if (!taskData.description.trim()) {
      toast({
        title: "Task description required",
        description: "Please enter a task description",
        variant: "destructive",
      });
      return;
    }
    
    if (taskData.points < 1) {
      taskData.points = 1;
    }
    
    // Create task object with default values
    const newTask = createTaskWithDefaults(taskData);
    
    // Optimistically update UI
    dispatch({ type: 'ADD_TASK', payload: newTask });
    
    if (isAuthenticated && isPaired) {
      try {
        console.log('🔄 Sending task to database:', taskData);
        await taskService.createTask(taskData);
        console.log('✅ Task created in database');
        
        // Success toast
        sonnerToast.success("Task added", {
          description: `"${taskData.description}" has been added`
        });
      } catch (error: any) {
        console.error("❌ Error creating task:", error);
        
        // Remove the task from the local state if the DB operation failed
        dispatch({ type: 'REMOVE_TASK', payload: { id: newTask.id } });
      }
    } else if (!isAuthenticated) {
      showAuthRequiredToast();
    } else {
      sonnerToast.success("Task added", {
        description: `"${taskData.description}" has been added`
      });
    }
  }, [isAuthenticated, isPaired, taskService, dispatch, toast, showAuthRequiredToast]);
  
  // Function to complete a task
  const completeTask = useCallback(async (id: string) => {
    console.log('✅ Completing task:', id);
    
    if (!isAuthenticated) {
      showAuthRequiredToast();
      return;
    }
    
    // Find the task to be completed
    const tasks = dispatch((state: any) => state.tasks);
    const task = tasks.find((t: Task) => t.id === id);
    
    if (!task) {
      console.error(`❌ Task with ID ${id} not found`);
      return;
    }
    
    if (task.completed) {
      console.log('⚠️ Task already completed:', id);
      return;
    }
    
    // Optimistically update UI
    dispatch({ type: 'COMPLETE_TASK', payload: { id, userId: user?.id } });
    
    if (isAuthenticated && isPaired && user) {
      try {
        console.log('🔄 Marking task as completed in database:', id);
        await taskService.completeTask(id, user.id);
        console.log('✅ Task marked as completed in database');
        
        // Make sure we refetch the points after completion
        refetchPoints();
        
        sonnerToast.success("Task completed!", {
          description: `You earned points`,
        });
      } catch (error: any) {
        console.error("❌ Error completing task:", error);
        
        // Revert the completed status if the DB operation failed
        dispatch({ type: 'UNDO_COMPLETE_TASK', payload: { id } });
        
        toast({
          title: "Error completing task",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      sonnerToast.success("Task completed!", {
        description: `You earned points`,
      });
    }
  }, [isAuthenticated, isPaired, user, taskService, dispatch, toast, showAuthRequiredToast, refetchPoints]);
  
  // Function to delete a task
  const deleteTask = useCallback(async (id: string) => {
    console.log('🗑️ Deleting task:', id);
    
    if (!isAuthenticated) {
      showAuthRequiredToast();
      return;
    }
    
    // Find the task to be deleted for showing in toast
    const tasks = dispatch((state: any) => state.tasks);
    const taskToDelete = tasks.find((t: Task) => t.id === id);
    
    // Optimistically update UI
    dispatch({ type: 'DELETE_TASK', payload: { id } });
    
    if (isAuthenticated && isPaired) {
      try {
        console.log('🔄 Deleting task from database:', id);
        await taskService.deleteTask(id);
        console.log('✅ Task deleted from database');
        
        // If the task was completed, refetch points since deletion affects total points
        if (taskToDelete?.completed) {
          refetchPoints();
        }
        
        if (taskToDelete) {
          sonnerToast.success("Task deleted", {
            description: `"${taskToDelete.description}" has been removed`
          });
        }
      } catch (error: any) {
        console.error("❌ Error deleting task:", error);
        
        // Revert the deletion if the DB operation failed
        if (taskToDelete) {
          dispatch({ type: 'ADD_TASK', payload: taskToDelete });
        }
        
        toast({
          title: "Error deleting task",
          description: error.message,
          variant: "destructive",
        });
      }
    } else if (taskToDelete) {
      sonnerToast.success("Task deleted", {
        description: `"${taskToDelete.description}" has been removed`
      });
    }
  }, [isAuthenticated, isPaired, taskService, dispatch, toast, showAuthRequiredToast, refetchPoints]);

  return {
    addTask,
    completeTask,
    deleteTask
  };
}
