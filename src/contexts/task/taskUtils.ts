
import { Task, TaskTag } from '@/types/Task';
import { v4 as uuidv4 } from 'uuid';
import { TaskState, TASKS_STORAGE_KEY } from './taskReducer';

// Tag color mapping
export const getTagColor = (tag: TaskTag): string => {
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

// Create a new task with default values
export const createTaskWithDefaults = (
  task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'completedAt'>
): Task => {
  return {
    id: uuidv4(),
    completed: false,
    createdAt: new Date(),
    ...task
  };
};

// Default tag colors mapping - matches the one in initialTaskState
const defaultTagColors: Record<TaskTag, string> = {
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

// Initialize state from localStorage or with default values
export const initializeTaskState = (): TaskState => {
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
        // Make sure tagColors exists in restored state, if not use default
        tagColors: parsedState.tagColors || defaultTagColors
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
    tagColors: defaultTagColors,
  };
};
