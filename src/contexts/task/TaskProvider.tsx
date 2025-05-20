
import React from 'react';
import { TaskContext } from './TaskContext';
import { useTaskState } from '@/hooks/use-task-state';
import { useTaskActions } from '@/hooks/use-task-actions';
import { useTagColors } from '@/hooks/use-tag-colors';
import { usePairStatus } from '@/hooks/use-pair-status';

export const TaskProvider = ({ children }: { children: React.ReactNode }) => {
  // Use custom hooks to separate concerns
  const { tasks, earnedPoints, dispatch, loadingTasks, error, refetchTasks } = useTaskState();
  const { getTagColor } = useTagColors();
  const { pairLoading } = usePairStatus();
  const { addTask, completeTask, deleteTask } = useTaskActions(dispatch);
  
  // Get refetchPoints from useUserPoints for the context
  const { refetch: refetchPoints } = useUserPoints();

  // Combine the loading states
  const isLoadingTasks = loadingTasks || pairLoading;

  return (
    <TaskContext.Provider
      value={{
        tasks,
        earnedPoints,
        addTask,
        completeTask,
        deleteTask,
        getTagColor,
        loadingTasks: isLoadingTasks,
        error,
        refetchTasks,
        refetchPoints
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

// Import at the end to avoid circular dependencies
import { useUserPoints } from '@/hooks/use-user-points';
