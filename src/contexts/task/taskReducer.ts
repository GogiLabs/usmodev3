
import { Task, TaskTag } from '@/types/Task';
import { getTagColor } from './taskUtils';

// Export key for localStorage
export const TASKS_STORAGE_KEY = 'app_tasks_state';

// Define state interface
export interface TaskState {
  tasks: Task[];
  earnedPoints: number;
  tagColors: Record<TaskTag, string>;
}

// Define initial state
export const initialTaskState: TaskState = {
  tasks: [],
  earnedPoints: 0,
  tagColors: {
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
  }
};

// Define action types
type TaskAction =
  | { type: 'SET_TASKS'; payload: { tasks: Task[]; earnedPoints: number } }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'REMOVE_TASK'; payload: string }
  | { type: 'COMPLETE_TASK'; payload: { id: string; userId?: string } }
  | { type: 'UNDO_COMPLETE_TASK'; payload: string }
  | { type: 'DELETE_TASK'; payload: { id: string } }
  | { type: 'SYNC_POINTS'; payload: number }
  | { type: 'GET_STATE' };

// Reducer function
export const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
  console.log(`🔄 [taskReducer] Processing action: ${action.type}`);
  
  switch (action.type) {
    case 'SET_TASKS':
      return {
        ...state,
        tasks: action.payload.tasks,
        earnedPoints: action.payload.earnedPoints
      };

    case 'ADD_TASK':
      return {
        ...state,
        tasks: [action.payload, ...state.tasks]
      };

    case 'REMOVE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload)
      };

    case 'COMPLETE_TASK': {
      const now = new Date();
      const { id, userId } = action.payload;
      const updatedTasks = state.tasks.map(task => {
        if (task.id === id) {
          return {
            ...task,
            completed: true,
            completedAt: now,
            completedBy: userId
          };
        }
        return task;
      });
      
      // Recalculate earned points
      const earnedPoints = updatedTasks.reduce(
        (sum, task) => (task.completed ? sum + task.points : sum),
        0
      );
      
      console.log(`📊 [taskReducer] Completed task. New earned points: ${earnedPoints}`);

      return {
        ...state,
        tasks: updatedTasks,
        earnedPoints
      };
    }

    case 'UNDO_COMPLETE_TASK': {
      const updatedTasks = state.tasks.map(task => {
        if (task.id === action.payload) {
          return {
            ...task,
            completed: false,
            completedAt: undefined,
            completedBy: undefined
          };
        }
        return task;
      });
      
      // Recalculate earned points 
      const earnedPoints = updatedTasks.reduce(
        (sum, task) => (task.completed ? sum + task.points : sum),
        0
      );
      
      console.log(`📊 [taskReducer] Undid task completion. New earned points: ${earnedPoints}`);

      return {
        ...state,
        tasks: updatedTasks,
        earnedPoints
      };
    }

    case 'DELETE_TASK': {
      const { id } = action.payload;
      const filteredTasks = state.tasks.filter(task => task.id !== id);
      
      // Recalculate earned points
      const earnedPoints = filteredTasks.reduce(
        (sum, task) => (task.completed ? sum + task.points : sum), 
        0
      );
      
      console.log(`📊 [taskReducer] Deleted task. New earned points: ${earnedPoints}`);

      return {
        ...state,
        tasks: filteredTasks,
        earnedPoints
      };
    }

    case 'SYNC_POINTS':
      console.log(`📊 [taskReducer] Syncing points manually: ${action.payload}`);
      return {
        ...state,
        earnedPoints: action.payload
      };

    case 'GET_STATE':
      // Just return the current state (useful for checking state)
      return state;
      
    default:
      return state;
  }
};
