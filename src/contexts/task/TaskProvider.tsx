
import React, { useReducer, useEffect, useState, useCallback } from 'react';
import { TaskContext } from './TaskContext';
import { taskReducer, initialTaskState } from './taskReducer';
import { useAuth } from '../AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useTasks } from '@/hooks/use-tasks';
import { usePairStatus } from '@/hooks/use-pair-status';
import { useTaskService } from '@/services/taskService';
import { createTaskWithDefaults } from './taskUtils';
import { toast as sonnerToast } from 'sonner';
import { Task, TaskTag } from '@/types/Task';
import { useUserPoints } from '@/hooks/use-user-points';

export const TaskProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(taskReducer, initialTaskState);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { isAuthenticated, user, showAuthRequiredToast } = useAuth();
  const { isPaired, pairData, loading: pairLoading } = usePairStatus();
  const { tasks, loading: tasksLoading, error: tasksError, refetchTasks } = useTasks();
  const { points, refetch: refetchPoints, updatePointsOptimistically } = useUserPoints();
  const { toast } = useToast();
  
  console.log(`🔄 [TaskProvider] Initializing/updating provider. isPaired: ${isPaired}, hasUser: ${!!user}`);
  
  // Create a performance-optimized version of the refetchPoints callback
  const optimizedRefetchPoints = useCallback(async () => {
    console.log('🚀 [TaskProvider] Optimized refetchPoints called - direct update');
    const startTime = performance.now();
    try {
      await refetchPoints();
      const duration = (performance.now() - startTime).toFixed(2);
      console.log(`✅ [TaskProvider] Optimized refetchPoints completed in ${duration}ms`);
    } catch (error) {
      console.error('❌ [TaskProvider] Error in optimized refetchPoints:', error);
    }
  }, [refetchPoints]);
  
  const taskService = useTaskService(pairData?.pair_id, optimizedRefetchPoints);

  // Sync tasks from DB to state
  useEffect(() => {
    if (tasks && !tasksLoading) {
      console.log(`📊 [TaskProvider] Syncing ${tasks.length} tasks from database`);
      
      // Calculate earned points from completed tasks
      const earnedPoints = tasks.reduce((sum, task) => 
        task.completed ? sum + task.points : sum, 0);
      
      dispatch({ type: 'SET_TASKS', payload: { tasks, earnedPoints } });
    }
  }, [tasks, tasksLoading]);
  
  // Update loading state
  useEffect(() => {
    setLoadingTasks(tasksLoading || pairLoading);
  }, [tasksLoading, pairLoading]);
  
  // Update error state
  useEffect(() => {
    if (tasksError) {
      console.error('❌ [TaskProvider] Tasks fetch error:', tasksError);
      setError(tasksError);
    } else {
      setError(null);
    }
  }, [tasksError]);

  // Function to add a new task
  const addTask = async (taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'completedAt'>) => {
    console.log('➕ [TaskProvider] Adding new task:', taskData);
    
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
        console.log('🔄 [TaskProvider] Sending task to database:', taskData);
        await taskService.createTask(taskData);
        console.log('✅ [TaskProvider] Task created in database');
        
        // Success toast
        sonnerToast.success("Task added", {
          description: `"${taskData.description}" has been added`
        });
      } catch (error: any) {
        console.error("❌ [TaskProvider] Error creating task:", error);
        
        // Remove the task from the local state if the DB operation failed
        dispatch({ type: 'REMOVE_TASK', payload: newTask.id });
      }
    } else if (!isAuthenticated) {
      showAuthRequiredToast();
    } else {
      sonnerToast.success("Task added", {
        description: `"${taskData.description}" has been added`
      });
    }
  };
  
  // Function to complete a task
  const completeTask = async (id: string) => {
    console.log('✅ [TaskProvider] Completing task:', id);
    const startTime = performance.now();
    
    if (!isAuthenticated) {
      showAuthRequiredToast();
      return;
    }
    
    const task = state.tasks.find(t => t.id === id);
    if (!task) {
      console.error(`❌ [TaskProvider] Task with ID ${id} not found`);
      return;
    }
    
    if (task.completed) {
      console.log('⚠️ [TaskProvider] Task already completed:', id);
      return;
    }
    
    // Optimistically update UI
    dispatch({ type: 'COMPLETE_TASK', payload: { id, userId: user?.id } });
    
    // Optimistically update points display immediately
    // This provides immediate visual feedback to user
    updatePointsOptimistically(task.points);
    
    if (isAuthenticated && isPaired && user) {
      try {
        console.log('🔄 [TaskProvider] Marking task as completed in database:', id);
        await taskService.completeTask(id, user.id);
        console.log('✅ [TaskProvider] Task marked as completed in database');
        
        // Call refetchPoints immediately after task completion to ensure points update is triggered fast
        console.log('🔄 [TaskProvider] Explicitly refetching points after task completion');
        await optimizedRefetchPoints();
        
        const taskCompletionDuration = (performance.now() - startTime).toFixed(2);
        console.log(`⏱️ [TaskProvider] Task completion flow took ${taskCompletionDuration}ms`);
        
        sonnerToast.success("Task completed!", {
          description: `You earned ${task.points} points`,
        });
        
        // Add a backup refetch with delay to ensure UI is updated
        setTimeout(() => {
          console.log('🔄 [TaskProvider] Backup refetch after task completion');
          refetchPoints();
        }, 1000);
      } catch (error: any) {
        console.error("❌ [TaskProvider] Error completing task:", error);
        
        // Revert the completed status if the DB operation failed
        dispatch({ type: 'UNDO_COMPLETE_TASK', payload: id });
        
        toast({
          title: "Error completing task",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      sonnerToast.success("Task completed!", {
        description: `You earned ${task.points} points`,
      });
    }
  };
  
  // Function to delete a task
  const deleteTask = async (id: string) => {
    console.log('🗑️ [TaskProvider] Deleting task:', id);
    
    if (!isAuthenticated) {
      showAuthRequiredToast();
      return;
    }
    
    // Find the task to be deleted for showing in toast
    const taskToDelete = state.tasks.find(t => t.id === id);
    
    // Optimistically update UI
    dispatch({ type: 'DELETE_TASK', payload: { id } });
    
    if (isAuthenticated && isPaired) {
      try {
        console.log('🔄 [TaskProvider] Deleting task from database:', id);
        await taskService.deleteTask(id);
        console.log('✅ [TaskProvider] Task deleted from database');
        
        if (taskToDelete && taskToDelete.completed) {
          console.log('🔄 [TaskProvider] Refetching points after deleting completed task');
          // If task was completed, we need to update points
          updatePointsOptimistically(-taskToDelete.points);
          await refetchPoints();
          console.log('✅ [TaskProvider] Points refetched after task deletion');
        }
        
        if (taskToDelete) {
          sonnerToast.success("Task deleted", {
            description: `"${taskToDelete.description}" has been removed`
          });
        }
      } catch (error: any) {
        console.error("❌ [TaskProvider] Error deleting task:", error);
        
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
  };
  
  // Get a color for a task tag
  const getTagColor = useCallback((tag: TaskTag): string => {
    return state.tagColors[tag] || "bg-gray-100 text-gray-800";
  }, [state.tagColors]);

  // Explicitly log each time the context value changes
  const contextValue = {
    tasks: state.tasks,
    earnedPoints: state.earnedPoints,
    addTask,
    completeTask,
    deleteTask,
    getTagColor,
    loadingTasks,
    error,
    refetchTasks,
    refetchPoints: optimizedRefetchPoints
  };
  
  console.log('🔄 [TaskProvider] Refreshing context value with tasks:', state.tasks.length);

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
};
