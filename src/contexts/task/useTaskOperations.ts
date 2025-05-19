
import { useState, useCallback } from 'react';
import { Task } from '@/types/Task';
import { useAuth } from '../AuthContext';
import { useTasks } from '@/hooks/use-supabase-data';
import { useTaskService, mapDbTaskToAppTask } from '@/services/taskService';
import { usePair, usePairPoints } from '@/hooks/use-supabase-data';
import { useToast } from '@/components/ui/use-toast';
import { toast as sonnerToast } from 'sonner';

export const useTaskOperations = () => {
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [networkError, setNetworkError] = useState<Error | null>(null);

  const { isAuthenticated, user, showAuthRequiredToast } = useAuth();
  const { data: pair } = usePair();
  const { data: dbTasks, isLoading: dbTasksLoading, error: dbTasksError, refetch: refetchDbTasks } = useTasks(pair?.id);
  const { data: pairPoints, refetch: refetchPairPoints } = usePairPoints(pair?.id);
  const taskService = useTaskService(pair?.id);
  const { toast } = useToast();

  // Refetch tasks function
  const refetchTasks = useCallback(() => {
    console.log('🔄 Manually refetching tasks');
    setRetryCount(prev => prev + 1);
    if (pair?.id) {
      refetchDbTasks();
      refetchPairPoints();
    }
  }, [pair?.id, refetchDbTasks, refetchPairPoints]);

  // Handle network errors
  const handleNetworkError = useCallback((error: any) => {
    console.error('❌ Task fetch error:', error);
    setError(new Error(error.message || "Failed to load tasks"));
    setNetworkError(error);
  }, []);

  // Clear errors
  const clearErrors = useCallback(() => {
    setError(null);
    setNetworkError(null);
  }, []);

  const addTask = async (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'completedAt'>) => {
    console.log('➕ Adding new task:', task);
    
    // Validate task data
    if (!task.description.trim()) {
      toast({
        title: "Task description required",
        description: "Please enter a task description",
        variant: "destructive",
      });
      return null;
    }
    
    if (task.points < 1) {
      task.points = 1;
    }
    
    if (isAuthenticated && pair) {
      try {
        console.log('🔄 Sending task to database:', task);
        const createdTask = await taskService.createTask(task);
        console.log('✅ Task created in database:', createdTask);
        
        // Success toast
        sonnerToast.success("Task added", {
          description: `"${task.description}" has been added`
        });
        
        // Refresh points
        refetchPairPoints();
        return createdTask;
      } catch (error: any) {
        console.error("❌ Error creating task:", error);
        toast({
          title: "Error creating task",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }
    } else {
      if (!isAuthenticated) {
        sonnerToast.success("Task added", {
          description: `"${task.description}" has been added`
        });
      }
      return null;
    }
  };

  const completeTask = async (id: string) => {
    console.log('✓ Completing task:', id);
    
    if (isAuthenticated && user && pair) {
      try {
        console.log('🔄 Marking task as completed in database:', id);
        const completedTask = await taskService.completeTask(id, user.id);
        console.log('✅ Task completed in database:', completedTask);
        
        // Refresh pair points
        refetchPairPoints();
        return completedTask;
      } catch (error: any) {
        console.error("❌ Error completing task:", error);
        toast({
          title: "Error completing task",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }
    } else {
      if (isAuthenticated) {
        showAuthRequiredToast();
      }
      return null;
    }
  };

  const deleteTask = async (id: string) => {
    console.log('🗑️ Deleting task:', id);
    
    if (isAuthenticated && pair) {
      try {
        console.log('🔄 Deleting task from database:', id);
        await taskService.deleteTask(id);
        console.log('✅ Task deleted from database:', id);
        
        // If the task was completed, refresh points
        const taskWasCompleted = dbTasks?.some(task => task.id === id && task.completed);
        if (taskWasCompleted) {
          refetchPairPoints();
        }
        return true;
      } catch (error: any) {
        console.error("❌ Error deleting task:", error);
        toast({
          title: "Error deleting task",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }
    } else {
      if (isAuthenticated) {
        showAuthRequiredToast();
      }
      return false;
    }
  };

  return {
    dbTasks, 
    dbTasksLoading, 
    dbTasksError,
    pair,
    isAuthenticated,
    user,
    error,
    networkError,
    retryCount,
    setRetryCount,
    addTask,
    completeTask,
    deleteTask,
    refetchTasks,
    handleNetworkError,
    clearErrors
  };
};
