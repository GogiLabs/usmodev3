
import { Button } from "@/components/ui/button";
import { Task } from "@/types/Task";
import { useTask } from "@/contexts/TaskContext";
import { CheckCircle, Circle, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
}

export function TaskItem({ task }: TaskItemProps) {
  const { completeTask, deleteTask, getTagColor } = useTask();
  const [isAnimating, setIsAnimating] = useState(false);
  
  const handleComplete = () => {
    if (!task.completed) {
      setIsAnimating(true);
      completeTask(task.id);
      
      // Reset animation state after animation completes
      setTimeout(() => setIsAnimating(false), 1000);
    }
  };
  
  return (
    <div 
      className={cn(
        "flex items-center justify-between p-4 border rounded-lg mb-2 transition-all duration-300",
        task.completed ? 'bg-muted' : 'bg-white',
        isAnimating && 'bg-primary/10 scale-[1.02]'
      )}
    >
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleComplete}
          disabled={task.completed}
          className={cn(
            task.completed ? "text-primary cursor-default" : "text-muted-foreground hover:text-primary",
            isAnimating && "animate-pulse"
          )}
        >
          {task.completed ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
          {isAnimating && (
            <Sparkles className="h-4 w-4 absolute text-primary animate-fade-in" />
          )}
        </Button>
        
        <div className="flex flex-col">
          <span className={cn(
            task.completed ? "line-through text-muted-foreground" : "",
            isAnimating && "text-primary font-medium"
          )}>
            {task.description}
          </span>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${getTagColor(task.tag)}`}>
              {task.tag}
            </span>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full text-primary-foreground font-medium transition-all",
              isAnimating ? "bg-primary scale-110" : "bg-primary/20"
            )}>
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
