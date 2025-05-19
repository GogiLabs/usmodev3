
import React, { useReducer, ReactNode, useEffect, useState } from 'react';
import { Task } from '@/types/Task';
import { useTaskOperations } from './useTaskOperations';
import { TaskContext } from './TaskContext';
import { taskReducer } from './taskReducer';
import { getTagColor, createTaskWithDefaults, initializeTaskState } from './taskUtils';
import { showTaskAddedToast, showTaskCompletedToast, showTaskDeletedToast } from './TaskNotifications';

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(taskReducer, null, initializeTaskState);
  const [loadingTasks, setLoadingTasks] = useState(false);
  
  const {
    dbTasks,
    dbTasksLoading,
    dbTasksError,
    pair,
    isAuthenticated,
    user,
    error,
    handleNetworkError,
    clearErrors,
    addTask: addTaskToDb,
    completeTask: completeTaskInDb,
    deleteTask: deleteTaskInDb,
    refetchTasks
  } = useTaskOperations();

  // Handle network errors
  useEffect(() => {
    if (dbTasksError) {
      handleNetworkError(dbTasksError);
    } else {
      clearErrors();
    }
  }, [dbTasksError, clearErrors, handleNetworkError]);

  // Sync with Supabase when authenticated and we have DB tasks
  useEffect(() => {
    if (isAuthenticated && dbTasks && pair) {
      setLoadingTasks(true);
      
      try {
        console.log(`📊 Syncing ${dbTasks.length} tasks from database`);
        
        // Update local state with DB tasks
        dispatch({ type: 'SYNC_DB_TASKS', payload: dbTasks });
      } catch (err) {
        console.error("❌ Error syncing tasks:", err);
      } finally {
        setLoadingTasks(false);
      }
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

  const addTask = async (taskData: Omit<Task, 'id' | 'completed' | 'createdAt' | 'completedAt'>) => {
    // Create task object with default values
    const newTask = createTaskWithDefaults(taskData);

    // Optimistically update UI
    dispatch({ type: 'ADD_TASK', payload: newTask });

    // Add task to database if authenticated
    if (isAuthenticated) {
      await addTaskToDb(taskData);
    } else {
      showTaskAddedToast(taskData);
    }
  };

  const completeTask = async (id: string) => {
    // Find the task to be completed
    const taskToComplete = state.tasks.find(t => t.id === id);
    if (!taskToComplete) {
      console.error(`❌ Task with ID ${id} not found`);
      return;
    }
    
    if (taskToComplete.completed) {
      console.log('⚠️ Task already completed:', id);
      return;
    }

    // Optimistically update UI
    dispatch({ 
      type: 'COMPLETE_TASK', 
      payload: { 
        id, 
        userId: user?.id 
      } 
    });
    
    // Complete task in database if authenticated
    if (isAuthenticated) {
      await completeTaskInDb(id);
      showTaskCompletedToast(taskToComplete);
    } else {
      if (!isAuthenticated) {
        showTaskCompletedToast(taskToComplete);
      }
    }
  };

  const deleteTask = async (id: string) => {
    // Find the task to be deleted for showing in toast
    const taskToDelete = state.tasks.find(t => t.id === id);
    
    // Optimistically update UI
    dispatch({ type: 'DELETE_TASK', payload: { id } });
    
    // Delete task from database if authenticated
    if (taskToDelete) {
      if (isAuthenticated) {
        await deleteTaskInDb(id);
      }
      showTaskDeletedToast(taskToDelete);
    }
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
