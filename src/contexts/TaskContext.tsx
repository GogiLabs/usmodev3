
import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState, useCallback } from 'react';
import { Task, TaskTag } from '@/types/Task';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { useTasks } from '@/hooks/use-supabase-data';
import { useTaskService, mapDbTaskToAppTask } from '@/services/taskService';
import { usePair } from '@/hooks/use-supabase-data';
import { useToast } from '@/components/ui/use-toast';
import { useOptimisticUpdate } from '@/hooks/use-optimistic-update';
import { toast as sonnerToast } from 'sonner';

interface TaskState {
  tasks: Task[];
  earnedPoints: number;
}

type TaskAction =
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'COMPLETE_TASK'; payload: { id: string, userId?: string } }
  | { type: 'DELETE_TASK'; payload: { id: string } }
  | { type: 'LOAD_TASKS'; payload: TaskState }
  | { type: 'SYNC_DB_TASKS'; payload: Task[] };

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

// Local storage key
const TASKS_STORAGE_KEY = 'usmode_tasks';

const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
  let updatedState: TaskState;
  
  switch (action.type) {
    case 'ADD_TASK':
      updatedState = {
        ...state,
        tasks: [
          action.payload,
          ...state.tasks,
        ],
      };
      break;
      
    case 'COMPLETE_TASK': {
      const updatedTasks = state.tasks.map((task) => {
        if (task.id === action.payload.id && !task.completed) {
          return {
            ...task,
            completed: true,
            completedAt: new Date(),
            completedBy: action.payload.userId
          };
        }
        return task;
      });

      // Calculate new points
      const completedTask = state.tasks.find(
        (task) => task.id === action.payload.id && !task.completed
      );
      const pointsToAdd = completedTask ? completedTask.points : 0;

      updatedState = {
        tasks: updatedTasks,
        earnedPoints: state.earnedPoints + pointsToAdd,
      };
      break;
    }
    
    case 'DELETE_TASK':
      updatedState = {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.payload.id),
      };
      break;
      
    case 'LOAD_TASKS':
      updatedState = action.payload;
      break;

    case 'SYNC_DB_TASKS':
      updatedState = {
        tasks: action.payload,
        // Calculate earned points from completed tasks
        earnedPoints: action.payload.reduce(
          (total, task) => total + (task.completed ? task.points : 0), 0
        ),
      };
      break;
      
    default:
      return state;
  }
  
  // Save to localStorage whenever state changes (but only when not using DB)
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updatedState));
  return updatedState;
};

// Initialize state from localStorage or with default values
const initializeState = (): TaskState => {
  const storedState = localStorage.getItem(TASKS_STORAGE_KEY);
  
  if (storedState) {
    try {
      const parsedState = JSON.parse(storedState);
      
      // Convert string dates back to Date objects
      const tasksWithDates = parsedState.tasks.map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      }));
      
      return {
        ...parsedState,
        tasks: tasksWithDates,
      };
    } catch (error) {
      console.error('Error parsing stored tasks:', error);
    }
  }
  
  // Default initial state
  return {
    tasks: [
      {
        id: uuidv4(),
        description: "Do the dishes",
        points: 5,
        tag: "Dishes",
        completed: false,
        createdAt: new Date(),
      },
      {
        id: uuidv4(),
        description: "Take out the trash",
        points: 3,
        tag: "Cleaning",
        completed: false,
        createdAt: new Date(),
      },
      {
        id: uuidv4(),
        description: "Cook dinner",
        points: 10,
        tag: "Cooking",
        completed: false,
        createdAt: new Date(),
      },
    ],
    earnedPoints: 0,
  };
};

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(taskReducer, null, initializeState);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [networkError, setNetworkError] = useState<Error | null>(null);

  const { isAuthenticated, user, showAuthRequiredToast } = useAuth();
  const { data: pair } = usePair();
  const { data: dbTasks, isLoading: dbTasksLoading, error: dbTasksError } = useTasks(pair?.id);
  const taskService = useTaskService(pair?.id);
  const { toast } = useToast();

  // Refetch tasks function
  const refetchTasks = useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);

  // Handle network errors
  useEffect(() => {
    if (dbTasksError) {
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
        // Map DB tasks to app format
        const appTasks = dbTasks.map(mapDbTaskToAppTask);
        
        // Update local state with DB tasks
        dispatch({ type: 'SYNC_DB_TASKS', payload: appTasks });
      } catch (err) {
        console.error("Error syncing tasks:", err);
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

  // Setup optimistic updates
  const { execute: executeAddTask } = useOptimisticUpdate(
    async (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'completedAt'>) => {
      if (!pair) {
        throw new Error("Cannot create task: No pair ID");
      }
      return await taskService.createTask(task);
    }
  );

  const { execute: executeCompleteTask } = useOptimisticUpdate(
    async (params: { taskId: string, userId: string }) => {
      return await taskService.completeTask(params.taskId, params.userId);
    }
  );

  const { execute: executeDeleteTask } = useOptimisticUpdate(
    async (taskId: string) => {
      await taskService.deleteTask(taskId);
      return taskId;
    }
  );

  const addTask = async (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'completedAt'>) => {
    // Create task object with default values
    const newTask: Task = {
      id: uuidv4(),
      completed: false,
      createdAt: new Date(),
      ...task
    };

    // Optimistically update UI
    dispatch({ type: 'ADD_TASK', payload: newTask });

    if (isAuthenticated && pair) {
      try {
        await taskService.createTask(task);
        // Success toast
        sonnerToast.success("Task added", {
          description: `"${task.description}" has been added`
        });
        // Tasks will be updated via the useTasks hook's realtime subscription
      } catch (error: any) {
        console.error("Error creating task:", error);
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
    if (isAuthenticated && user && pair) {
      // Optimistically update UI
      dispatch({ type: 'COMPLETE_TASK', payload: { id, userId: user.id } });
      
      try {
        const completedTask = state.tasks.find(t => t.id === id);
        
        await taskService.completeTask(id, user.id);
        
        // Success animation and toast
        if (completedTask) {
          sonnerToast.success(`+${completedTask.points} points earned!`, {
            description: `"${completedTask.description}" completed`
          });
        }
        // Tasks will be updated via the useTasks hook's realtime subscription
      } catch (error: any) {
        console.error("Error completing task:", error);
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
        const completedTask = state.tasks.find(t => t.id === id);
        if (completedTask) {
          sonnerToast.success(`+${completedTask.points} points earned!`, {
            description: `"${completedTask.description}" completed`
          });
        }
      }
    }
  };

  const deleteTask = async (id: string) => {
    // Find the task to be deleted for showing in toast
    const taskToDelete = state.tasks.find(t => t.id === id);
    
    // Optimistically update UI
    dispatch({ type: 'DELETE_TASK', payload: { id } });
    
    if (isAuthenticated && pair) {
      try {
        await taskService.deleteTask(id);
        
        if (taskToDelete) {
          sonnerToast.success("Task deleted", {
            description: `"${taskToDelete.description}" has been removed`
          });
        }
        // Tasks will be updated via the useTasks hook's realtime subscription
      } catch (error: any) {
        console.error("Error deleting task:", error);
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

  // Tag color mapping
  const getTagColor = (tag: TaskTag): string => {
    const tagColors: Record<TaskTag, string> = {
      'Cleaning': 'bg-blue-100 text-blue-800',
      'Cooking': 'bg-orange-100 text-orange-800',
      'Laundry': 'bg-purple-100 text-purple-800',
      'Dishes': 'bg-cyan-100 text-cyan-800',
      'GroceryShopping': 'bg-green-100 text-green-800',
      'BillsAndFinances': 'bg-amber-100 text-amber-800',
      'RepairsAndMaintenance': 'bg-stone-100 text-stone-800',
      'PetCare': 'bg-pink-100 text-pink-800',
      'Gardening': 'bg-emerald-100 text-emerald-800',
      'Other': 'bg-gray-100 text-gray-800',
    };
    return tagColors[tag];
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
