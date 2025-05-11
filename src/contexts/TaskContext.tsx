
import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState } from 'react';
import { Task, TaskTag } from '@/types/Task';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { useTasks } from '@/hooks/use-supabase-data';
import { useTaskService, mapDbTaskToAppTask } from '@/services/taskService';
import { usePair } from '@/hooks/use-supabase-data';
import { toast } from '@/components/ui/use-toast';

interface TaskState {
  tasks: Task[];
  earnedPoints: number;
}

type TaskAction =
  | { type: 'ADD_TASK'; payload: Omit<Task, 'id' | 'completed' | 'createdAt' | 'completedAt'> }
  | { type: 'COMPLETE_TASK'; payload: { id: string } }
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
          ...state.tasks,
          {
            id: uuidv4(),
            completed: false,
            createdAt: new Date(),
            ...action.payload,
          },
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

  const { isAuthenticated, user, showAuthRequiredToast } = useAuth();
  const { data: pair } = usePair();
  const { data: dbTasks, isLoading: dbTasksLoading } = useTasks(pair?.id);
  const taskService = useTaskService(pair?.id);

  // Sync with Supabase when authenticated and we have DB tasks
  useEffect(() => {
    if (isAuthenticated && dbTasks && pair) {
      setLoadingTasks(true);
      
      // Map DB tasks to app format
      const appTasks = dbTasks.map(mapDbTaskToAppTask);
      
      // Update local state with DB tasks
      dispatch({ type: 'SYNC_DB_TASKS', payload: appTasks });
      setLoadingTasks(false);
    }
  }, [isAuthenticated, dbTasks, pair]);

  // Update loading state based on DB loading
  useEffect(() => {
    if (isAuthenticated && pair) {
      setLoadingTasks(dbTasksLoading);
    } else {
      setLoadingTasks(false);
    }
  }, [isAuthenticated, dbTasksLoading, pair]);

  const addTask = async (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'completedAt'>) => {
    if (isAuthenticated && pair) {
      try {
        await taskService.createTask(task);
        // Tasks will be updated via the useTasks hook's realtime subscription
      } catch (error) {
        // createTask already shows toast errors
        // Fallback to local state
        dispatch({ type: 'ADD_TASK', payload: task });
      }
    } else {
      dispatch({ type: 'ADD_TASK', payload: task });
    }
  };

  const completeTask = async (id: string) => {
    if (isAuthenticated && user && pair) {
      try {
        await taskService.completeTask(id, user.id);
        // Tasks will be updated via the useTasks hook's realtime subscription
      } catch (error) {
        // completeTask already shows toast errors
        // Fallback to local state
        dispatch({ type: 'COMPLETE_TASK', payload: { id } });
      }
    } else {
      if (isAuthenticated) {
        showAuthRequiredToast();
      } else {
        dispatch({ type: 'COMPLETE_TASK', payload: { id } });
      }
    }
  };

  const deleteTask = async (id: string) => {
    if (isAuthenticated && pair) {
      try {
        await taskService.deleteTask(id);
        // Tasks will be updated via the useTasks hook's realtime subscription
      } catch (error) {
        // deleteTask already shows toast errors
        // Fallback to local state
        dispatch({ type: 'DELETE_TASK', payload: { id } });
      }
    } else {
      if (isAuthenticated) {
        showAuthRequiredToast();
      } else {
        dispatch({ type: 'DELETE_TASK', payload: { id } });
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
