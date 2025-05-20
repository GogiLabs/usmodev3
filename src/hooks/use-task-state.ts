
import { useReducer, useState, useEffect } from 'react';
import { taskReducer, initialTaskState } from '@/contexts/task/taskReducer';
import { useTasks } from '@/hooks/use-tasks';
import { Task } from '@/types/Task';

/**
 * Hook for managing task state with the reducer
 */
export function useTaskState() {
  const [state, dispatch] = useReducer(taskReducer, initialTaskState);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { tasks, loading: tasksLoading, error: tasksError, refetchTasks } = useTasks();
  
  // Sync tasks from DB to state
  useEffect(() => {
    if (tasks && !tasksLoading) {
      console.log(`📊 Syncing ${tasks.length} tasks from database`);
      dispatch({ type: 'SET_TASKS', payload: { tasks, earnedPoints: 0 } });
    }
  }, [tasks, tasksLoading]);
  
  // Update loading state
  useEffect(() => {
    setLoadingTasks(tasksLoading);
  }, [tasksLoading]);
  
  // Update error state
  useEffect(() => {
    if (tasksError) {
      console.error('❌ Tasks fetch error:', tasksError);
      setError(tasksError);
    } else {
      setError(null);
    }
  }, [tasksError]);

  return {
    tasks: state.tasks,
    earnedPoints: state.earnedPoints,
    dispatch,
    loadingTasks,
    error,
    refetchTasks
  };
}
