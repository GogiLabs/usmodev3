
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Task } from "@/types/Task";
import { useTask } from "@/contexts/task";
import { CheckCircle2, Trash2, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

interface TaskItemProps {
  task: Task;
}

export function TaskItem({ task }: TaskItemProps) {
  const { completeTask, deleteTask, getTagColor, refetchPoints } = useTask();
  const { isAuthenticated, showAuthRequiredToast } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const { toast } = useToast();
  const componentRef = useRef<HTMLDivElement>(null);
  
  const handleComplete = async () => {
    if (!isAuthenticated) {
      showAuthRequiredToast();
      return;
    }
    
    if (!task.completed) {
      setIsCompleting(true);
      await completeTask(task.id);
      
      // Make sure we refetch the points after a task is completed
      refetchPoints();
      
      setTimeout(() => {
        setIsCompleting(false);
      }, 500);
    }
  };
  
  const handleDelete = async () => {
    if (!isAuthenticated) {
      showAuthRequiredToast();
      return;
    }
    
    setIsDeleting(true);
    try {
      await deleteTask(task.id);
      
      // If the task was completed, we should also refetch points 
      // since deleting a completed task might affect points
      if (task.completed) {
        refetchPoints();
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      setIsDeleting(false);
      
      toast({
        title: "Error deleting task",
        description: "There was an error deleting this task. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Add animation on mount
  useEffect(() => {
    const element = componentRef.current;
    if (element) {
      element.style.opacity = '0';
      element.style.transform = 'translateY(10px)';
      
      setTimeout(() => {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }, 10);
    }
  }, []);
  
  const taskDate = task.completedAt || task.createdAt;
  const dateText = taskDate ? formatDistanceToNow(taskDate, { addSuffix: true }) : '';
  const formattedDate = taskDate ? format(taskDate, 'PPP') : '';
  
  // Apply dynamic classes based on task state
  const taskClasses = cn(
    "flex items-center justify-between p-3 border rounded-lg mb-2 transition-all duration-300",
    task.completed ? 'bg-muted/40' : 'bg-white',
    isDeleting && 'opacity-0 scale-95',
    isCompleting && 'bg-green-50'
  );
  
  return (
    <div 
      className={taskClasses} 
      ref={componentRef}
      style={{ transition: 'opacity 0.3s ease, transform 0.3s ease' }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "rounded-full h-7 w-7 transition-all", 
            task.completed ? "bg-primary/20 hover:bg-primary/30" : "hover:bg-primary/10",
            isCompleting && "bg-primary/30"
          )}
          onClick={handleComplete}
          disabled={task.completed}
        >
          <CheckCircle2 
            className={cn(
              "h-5 w-5 transition-colors", 
              task.completed ? "text-primary" : "text-muted-foreground",
              isCompleting && "text-primary"
            )}
            fill={task.completed || isCompleting ? "currentColor" : "none"} 
          />
        </Button>
        
        <div className="flex flex-col flex-1 min-w-0">
          <span className={cn(
            "text-sm font-medium truncate",
            task.completed && "line-through text-muted-foreground"
          )}>
            {task.description}
          </span>
          
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              getTagColor(task.tag)
            )}>
              {task.tag}
            </span>
            
            <span className="text-xs text-muted-foreground flex items-center gap-1" title={formattedDate}>
              <Clock className="h-3 w-3" />
              {dateText}
            </span>
            
            {task.points && (
              <span className={cn(
                "text-xs font-medium",
                task.completed ? "text-primary/70" : "text-primary"
              )}>
                {task.points} pts
              </span>
            )}
          </div>
        </div>
      </div>
      
      <AlertDialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
