
import { useTask } from "@/contexts/TaskContext";
import { TaskItem } from "./TaskItem";
import { TaskForm } from "./TaskForm";

export function TaskList() {
  const { tasks } = useTask();
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
