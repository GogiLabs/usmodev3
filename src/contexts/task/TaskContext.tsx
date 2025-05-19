
import React, { createContext, useContext } from 'react';
import { Task, TaskTag } from '@/types/Task';
import { TaskProvider } from './TaskProvider';

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

export const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTask = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

// Re-export the TaskProvider from this file for consistency in imports
export { TaskProvider } from './TaskProvider';
