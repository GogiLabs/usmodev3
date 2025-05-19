
import { Task } from '@/types/Task';
import { toast as sonnerToast } from 'sonner';

export const showTaskAddedToast = (task: Task | Omit<Task, 'id' | 'completed' | 'createdAt' | 'completedAt'>) => {
  sonnerToast.success("Task added", {
    description: `"${task.description}" has been added`
  });
};

export const showTaskCompletedToast = (task: Task) => {
  sonnerToast.success(`+${task.points} points earned!`, {
    description: `"${task.description}" completed`
  });
};

export const showTaskDeletedToast = (task: Task) => {
  sonnerToast.success("Task deleted", {
    description: `"${task.description}" has been removed`
  });
};
