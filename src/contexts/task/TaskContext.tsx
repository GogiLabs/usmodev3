
import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState, useCallback } from 'react';
import { Task, TaskTag } from '@/types/Task';
import { useAuth } from '../AuthContext';
import { useTasks } from '@/hooks/use-supabase-data';
import { useTaskService, mapDbTaskToAppTask } from '@/services/taskService';
import { usePair, usePairPoints } from '@/hooks/use-supabase-data';
import { useToast } from '@/components/ui/use-toast';
import { useOptimisticUpdate } from '@/hooks/use-optimistic-update';
import { toast as sonnerToast } from 'sonner';
import { taskReducer, TaskState, TaskAction } from './taskReducer';
import { getTagColor, createTaskWithDefaults, initializeTaskState } from './taskUtils';

// Define the context type
interface TaskContextType {
  tasks: Task[];
  earnedPoints: number;
  addTask: (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'completedAt'>) => void;
  completeTask: (id: string) => void;
  deleteTask: (id: string) => void;
  getTagColor: (tag: TaskTag) => string;
  loadingTasks: boolean;
  error: Error | null;
  refetchTasks: () => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(taskReducer, null, initializeTaskState);
  const [loadingTasks, setLoadingTasks] = useState(false);
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
  useEffect(() => {
    if (dbTasksError) {
      console.error('❌ Task fetch error:', dbTasksError);
      setError(new Error(dbTasksError.message || "Failed to load tasks"));
      setNetworkError(dbTasksError);
    } else {
      setError(null);
      setNetworkError(null);
    }
  }, [dbTasksError, retryCount]);

  // Sync with Supabase when authenticated and we have DB tasks
  useEffect(() => {
    if (isAuthenticated && dbTasks && pair) {
      setLoadingTasks(true);
      
      try {
        console.log(`📊 Syncing ${dbTasks.length} tasks from database`);
        
        // Map DB tasks to app format
        const appTasks = dbTasks.map(mapDbTaskToAppTask);
        
        // Update local state with DB tasks
        dispatch({ type: 'SYNC_DB_TASKS', payload: appTasks });
      } catch (err) {
        console.error("❌ Error syncing tasks:", err);
        setError(err instanceof Error ? err : new Error("Failed to process tasks data"));
      } finally {
        setLoadingTasks(false);
      }
    }
  }, [isAuthenticated, dbTasks, pair, retryCount]);

  // Update loading state based on DB loading
  useEffect(() => {
    if (isAuthenticated && pair) {
      setLoadingTasks(dbTasksLoading);
    } else {
      setLoadingTasks(false);
    }
  }, [isAuthenticated, dbTasksLoading, pair]);

  const addTask = async (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'completedAt'>) => {
    console.log('➕ Adding new task:', task);
    
    // Validate task data
    if (!task.description.trim()) {
      toast({
        title: "Task description required",
        description: "Please enter a task description",
        variant: "destructive",
      });
      return;
    }
    
    if (task.points < 1) {
      task.points = 1;
    }
    
    // Create task object with default values
    const newTask = createTaskWithDefaults(task);

    // Optimistically update UI
    dispatch({ type: 'ADD_TASK', payload: newTask });

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
      } catch (error: any) {
        console.error("❌ Error creating task:", error);
        toast({
          title: "Error creating task",
          description: error.message,
          variant: "destructive",
        });
      }
    } else if (!isAuthenticated) {
      sonnerToast.success("Task added", {
        description: `"${task.description}" has been added`
      });
    }
  };

  const completeTask = async (id: string) => {
    console.log('✓ Completing task:', id);
    
    // Find the task to be completed
    const taskToComplete = state.tasks.find(t => t.id === id);
    if (!taskToComplete) {
      console.error(`❌ Task with ID ${id} not found`);
      return;
    }
    
    if (taskToComplete.completed) {
      console.log('⚠️ Task already completed:', id);
      return;
    }

    if (isAuthenticated && user && pair) {
      // Optimistically update UI
      dispatch({ type: 'COMPLETE_TASK', payload: { id, userId: user.id } });
      
      try {
        console.log('🔄 Marking task as completed in database:', id);
        const completedTask = await taskService.completeTask(id, user.id);
        console.log('✅ Task completed in database:', completedTask);
        
        // Success animation and toast
        sonnerToast.success(`+${taskToComplete.points} points earned!`, {
          description: `"${taskToComplete.description}" completed`
        });
        
        // Refresh pair points
        refetchPairPoints();
      } catch (error: any) {
        console.error("❌ Error completing task:", error);
        toast({
          title: "Error completing task",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      if (isAuthenticated) {
        showAuthRequiredToast();
      } else {
        dispatch({ type: 'COMPLETE_TASK', payload: { id } });
        
        // Find the completed task to show point value
        sonnerToast.success(`+${taskToComplete.points} points earned!`, {
          description: `"${taskToComplete.description}" completed`
        });
      }
    }
  };

  const deleteTask = async (id: string) => {
    console.log('🗑️ Deleting task:', id);
    
    // Find the task to be deleted for showing in toast
    const taskToDelete = state.tasks.find(t => t.id === id);
    
    // Optimistically update UI
    dispatch({ type: 'DELETE_TASK', payload: { id } });
    
    if (isAuthenticated && pair) {
      try {
        console.log('🔄 Deleting task from database:', id);
        await taskService.deleteTask(id);
        console.log('✅ Task deleted from database:', id);
        
        if (taskToDelete) {
          sonnerToast.success("Task deleted", {
            description: `"${taskToDelete.description}" has been removed`
          });
        }
        
        // If the task was completed, refresh points
        if (taskToDelete?.completed) {
          refetchPairPoints();
        }
      } catch (error: any) {
        console.error("❌ Error deleting task:", error);
        toast({
          title: "Error deleting task",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      if (isAuthenticated) {
        showAuthRequiredToast();
      } else if (taskToDelete) {
        sonnerToast.success("Task deleted", {
          description: `"${taskToDelete.description}" has been removed`
        });
      }
    }
  };

  return (
    <TaskContext.Provider
      value={{
        tasks: state.tasks,
        earnedPoints: state.earnedPoints,
        addTask,
        completeTask,
        deleteTask,
        getTagColor,
        loadingTasks,
        error,
        refetchTasks
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTask = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};
