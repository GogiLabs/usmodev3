
import { useTask } from "@/contexts/TaskContext";
import { TaskItem } from "./TaskItem";
import { TaskForm } from "./TaskForm";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function TaskList() {
  const { tasks, loadingTasks } = useTask();
  
  if (loadingTasks) {
    return (
      <div className="h-full overflow-y-auto px-4 py-4">
        <div className="mb-4 flex justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
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
    <div className="h-full overflow-y-auto px-4 py-4">
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
  );
}
