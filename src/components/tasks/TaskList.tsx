
import { useTask } from "@/contexts/TaskContext";
import { TaskItem } from "./TaskItem";
import { TaskForm } from "./TaskForm";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Skeleton } from "@/components/ui/skeleton";
import { NetworkErrorAlert } from "@/components/common/NetworkErrorAlert";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { EmptyStateBanner } from "@/components/dashboard/EmptyStateBanner";
import { useAuth } from "@/contexts/AuthContext";
import { usePairDetails } from "@/hooks/use-supabase-data";
import { useState, useEffect } from "react";

export function TaskList() {
  const { tasks, loadingTasks, error, refetchTasks } = useTask();
  const { isAuthenticated } = useAuth();
  const { data: pairDetails } = usePairDetails();
  const [showEmptyState, setShowEmptyState] = useState(false);
  
  // Check if paired user banner should be shown
  const isPaired = pairDetails?.user_1_id && pairDetails?.user_2_id;
  
  // Show empty state banner after a delay if user is not paired
  // and there are no tasks and the user is authenticated
  useEffect(() => {
    if (isAuthenticated && !loadingTasks && tasks.length === 0 && !isPaired) {
      const timer = setTimeout(() => {
        setShowEmptyState(true);
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setShowEmptyState(false);
    }
  }, [isAuthenticated, loadingTasks, tasks.length, isPaired]);
  
  if (error) {
    return (
      <div className="h-full overflow-y-auto px-4 py-4">
        <NetworkErrorAlert 
          message={error.message || "Failed to load tasks. Please try again."} 
          onRetry={refetchTasks}
        />
        {tasks.length > 0 && (
          <div className="opacity-50">
            <h2 className="text-lg font-semibold mb-2">Showing cached data</h2>
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    );
  }
  
  if (loadingTasks) {
    return (
      <div className="h-full overflow-y-auto px-4 py-4">
        <div className="mb-4 flex justify-center">
          <LoadingSpinner text="Loading tasks..." />
        </div>
        {/* Loading skeleton UI */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={`task-skeleton-${i}`} className="flex items-center justify-between p-4 border rounded-lg mb-2">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
        ))}
      </div>
    );
  }
  
  const incompleteTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <ErrorBoundary>
      <div className="h-full overflow-y-auto px-4 py-4">
        {showEmptyState && <EmptyStateBanner />}
        
        <TaskForm />
        
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Tasks</h2>
          {incompleteTasks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No pending tasks. Add a new one!</p>
          ) : (
            incompleteTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))
          )}
        </div>
        
        {completedTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Completed</h2>
            {completedTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
