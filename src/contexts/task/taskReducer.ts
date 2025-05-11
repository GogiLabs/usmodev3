
import { Task } from '@/types/Task';

// Types
export interface TaskState {
  tasks: Task[];
  earnedPoints: number;
}

export type TaskAction =
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'COMPLETE_TASK'; payload: { id: string, userId?: string } }
  | { type: 'DELETE_TASK'; payload: { id: string } }
  | { type: 'LOAD_TASKS'; payload: TaskState }
  | { type: 'SYNC_DB_TASKS'; payload: Task[] };

// Local storage key
export const TASKS_STORAGE_KEY = 'usmode_tasks';

// Task reducer function
export const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
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
