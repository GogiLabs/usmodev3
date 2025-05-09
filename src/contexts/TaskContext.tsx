
import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Task, TaskTag } from '@/types/Task';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';

interface TaskState {
  tasks: Task[];
  earnedPoints: number;
}

type TaskAction =
  | { type: 'ADD_TASK'; payload: Omit<Task, 'id' | 'completed' | 'createdAt' | 'completedAt'> }
  | { type: 'COMPLETE_TASK'; payload: { id: string } }
  | { type: 'DELETE_TASK'; payload: { id: string } }
  | { type: 'LOAD_TASKS'; payload: TaskState };

interface TaskContextType {
  tasks: Task[];
  earnedPoints: number;
  addTask: (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'completedAt'>) => void;
  completeTask: (id: string) => void;
  deleteTask: (id: string) => void;
  getTagColor: (tag: TaskTag) => string;
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
      
    default:
      return state;
  }
  
  // Save to localStorage whenever state changes
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

  const { isAuthenticated, showAuthRequiredToast } = useAuth();

  const addTask = (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'completedAt'>) => {
    dispatch({ type: 'ADD_TASK', payload: task });
  };

  const completeTask = (id: string) => {
    if (isAuthenticated) {
      dispatch({ type: 'COMPLETE_TASK', payload: { id } });
    } else {
      showAuthRequiredToast();
    }
  };

  const deleteTask = (id: string) => {
    dispatch({ type: 'DELETE_TASK', payload: { id } });
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
