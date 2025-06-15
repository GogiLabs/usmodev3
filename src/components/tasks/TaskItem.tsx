import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Task } from "@/types/Task";
import { useTask } from "@/contexts/task";
import { CheckCircle2, Trash2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

interface TaskItemProps {
  task: Task;
}

export function TaskItem({ task }: TaskItemProps) {
  const { completeTask, deleteTask, getTagColor } = useTask();
  const { isAuthenticated, showAuthRequiredToast } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const { toast } = useToast();
  const componentRef = useRef<HTMLDivElement>(null);
  const taskCompletionTimeRef = useRef<number>(0);
  
  // Add logging right at the component render
  console.log(`🔍 [TaskItem] Rendering task ${task.id} - completed: ${task.completed}, description: "${task.description}"`);
  
  const handleComplete = async () => {
    console.log(`🚨 [TaskItem] BUTTON CLICKED! Task ID: ${task.id}, Completed: ${task.completed}, Authenticated: ${isAuthenticated}`);
    
    if (!isAuthenticated) {
      console.log(`❌ [TaskItem] User not authenticated, showing auth toast`);
      showAuthRequiredToast();
      return;
    }

    console.log(`🗺️ This is the function call you are looking for`);
    
    if (!task.completed) {
      taskCompletionTimeRef.current = performance.now();
      console.log(`🎯 [TaskItem] Starting task completion for task: ${task.id}`);
      setIsCompleting(true);
      
      try {
        // Just complete the task - PointsDisplay will handle the animation
        console.log(`🔄 [TaskItem] Calling completeTask from context`);
        await completeTask(task.id);
        const completionDuration = (performance.now() - taskCompletionTimeRef.current).toFixed(2);
        console.log(`✅ [TaskItem] Task completed: ${task.id} in ${completionDuration}ms`);
        
      } catch (error) {
        console.error(`❌ [TaskItem] Error completing task:`, error);
      } finally {
        setTimeout(() => {
          setIsCompleting(false);
        }, 500);
      }
    } else {
      console.log(`⚠️ [TaskItem] Task ${task.id} is already completed, ignoring click`);
    }
  };
  
  // Add a click handler that logs ALL button clicks
  const handleButtonClick = (e: React.MouseEvent) => {
    console.log(`🖱️ [TaskItem] Button click detected! Event:`, e);
    console.log(`🖱️ [TaskItem] Button disabled state:`, task.completed);
    console.log(`🖱️ [TaskItem] Task state:`, { id: task.id, completed: task.completed, description: task.description });
    console.log(`🖱️ [TaskItem] Click target:`, e.target);
    console.log(`🖱️ [TaskItem] Current target:`, e.currentTarget);
    
    // Call the actual handler
    handleComplete();
  };
  
  const handleDelete = async () => {
    if (!isAuthenticated) {
      showAuthRequiredToast();
      return;
    }
    
    setIsDeleting(true);
    console.log(`🗑️ [TaskItem] Starting task deletion for task: ${task.id}`);
    
    try {
      await deleteTask(task.id);
      console.log(`✅ [TaskItem] Task deleted: ${task.id}`);
      
      // Deletion is now handled properly via event system
    } catch (error: any) {
      console.error(`❌ [TaskItem] Error deleting task:`, error);
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
  
  console.log(`🎯 [TaskItem] About to render button for task ${task.id} - disabled: ${task.completed}`);
  
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
          onClick={handleButtonClick}
          disabled={task.completed}
          data-testid={`complete-task-${task.id}`}
          title={`DEBUG: Task ${task.id} - ${task.completed ? 'COMPLETED' : 'INCOMPLETE'}`}
        >
          <CheckCircle2 
            className={cn(
              "h-5 w-5 transition-colors", 
              task.completed ? "text-primary" : "text-muted-foreground",
              isCompleting && "text-primary"
            )}
            fill={task.completed || isCompleting ? "currentColor" : "none"} 
          />
          {/* Add debug text overlay */}
          <span className="absolute -bottom-6 left-0 text-xs text-red-500 font-bold bg-white px-1 rounded">
            {task.completed ? 'DONE' : 'CLICK'}
          </span>
        </Button>
        
        <div className="flex flex-col flex-1 min-w-0">
          <span className={cn(
            "text-sm font-medium truncate",
            task.completed && "line-through text-muted-foreground"
          )}>
            {task.description} [DEBUG: ID-{task.id}]
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
