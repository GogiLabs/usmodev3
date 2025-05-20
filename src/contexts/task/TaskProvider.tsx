
import React, { useReducer, useEffect, useState, useCallback } from 'react';
import { TaskContext } from './TaskContext';
import { taskReducer, initialTaskState, TaskState } from './taskReducer';
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
  const { points, refetch: refetchPoints } = useUserPoints();
  const { toast } = useToast();
  
  const taskService = useTaskService(pairData?.pair_id, refetchPoints);

  // Sync tasks from DB to state
  useEffect(() => {
    if (tasks && !tasksLoading) {
      console.log(`📊 Syncing ${tasks.length} tasks from database`);
      
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
      console.error('❌ Tasks fetch error:', tasksError);
      setError(tasksError);
    } else {
      setError(null);
    }
  }, [tasksError]);

  // Function to add a new task
  const addTask = async (taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'completedAt'>) => {
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
    console.log('✅ Completing task:', id);
    
    if (!isAuthenticated) {
      showAuthRequiredToast();
      return;
    }
    
    const task = state.tasks.find(t => t.id === id);
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
        
        sonnerToast.success("Task completed!", {
          description: `You earned ${task.points} points`,
        });
      } catch (error: any) {
        console.error("❌ Error completing task:", error);
        
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
    console.log('🗑️ Deleting task:', id);
    
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
        console.log('🔄 Deleting task from database:', id);
        await taskService.deleteTask(id);
        console.log('✅ Task deleted from database');
        
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
  };
  
  // Get a color for a task tag
  const getTagColor = (tag: TaskTag): string => {
    switch (tag) {
      case 'important':
        return 'bg-red-100 text-red-800';
      case 'urgent':
        return 'bg-orange-100 text-orange-800';
      case 'fun':
        return 'bg-purple-100 text-purple-800';
      case 'shared':
        return 'bg-blue-100 text-blue-800';
      case 'chore':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        refetchTasks,
        refetchPoints
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};
