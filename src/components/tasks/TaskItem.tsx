
import { Button } from "@/components/ui/button";
import { Task } from "@/types/Task";
import { useTask } from "@/contexts/TaskContext";
import { CheckCircle, Circle, Trash2 } from "lucide-react";

interface TaskItemProps {
  task: Task;
}

export function TaskItem({ task }: TaskItemProps) {
  const { completeTask, deleteTask, getTagColor } = useTask();
  
  return (
    <div className={`flex items-center justify-between p-4 border rounded-lg mb-2 ${task.completed ? 'bg-muted' : 'bg-white'}`}>
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => completeTask(task.id)}
          disabled={task.completed}
          className={task.completed ? "text-primary cursor-default" : "text-muted-foreground hover:text-primary"}
        >
          {task.completed ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </Button>
        
        <div className="flex flex-col">
          <span className={task.completed ? "line-through text-muted-foreground" : ""}>{task.description}</span>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${getTagColor(task.tag)}`}>
              {task.tag}
            </span>
            <span className="text-xs bg-primary/20 px-2 py-0.5 rounded-full text-primary-foreground font-medium">
              +{task.points} pts
            </span>
          </div>
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => deleteTask(task.id)}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
