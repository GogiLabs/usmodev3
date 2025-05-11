
import { Button } from "@/components/ui/button";
import { Task } from "@/types/Task";
import { useTask } from "@/contexts/task/TaskContext";
import { CheckCircle, Circle, Sparkles, Trash2, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface TaskItemProps {
  task: Task;
}

export function TaskItem({ task }: TaskItemProps) {
  const { completeTask, deleteTask, getTagColor } = useTask();
  const { isAuthenticated, showAuthRequiredToast } = useAuth();
  const [isAnimating, setIsAnimating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Reset animation state when task changes
  useEffect(() => {
    setIsAnimating(false);
    setShowConfetti(false);
  }, [task.id]);
  
  const handleComplete = () => {
    if (task.completed) return;
    
    if (!isAuthenticated) {
      showAuthRequiredToast();
      return;
    }
    
    setIsAnimating(true);
    setShowConfetti(true);
    completeTask(task.id);
    
    // Reset animation state after animation completes
    setTimeout(() => {
      setIsAnimating(false);
      setTimeout(() => setShowConfetti(false), 500);
    }, 1000);
  };
  
  const handleDelete = () => {
    if (!isAuthenticated) {
      showAuthRequiredToast();
      return;
    }
    
    setIsDeleting(true);
    
    // Add small delay for animation
    setTimeout(() => {
      deleteTask(task.id);
    }, 300);
  };
  
  return (
    <div 
      className={cn(
        "flex items-center justify-between p-4 border rounded-lg mb-2 transition-all duration-300",
        task.completed ? 'bg-muted' : 'bg-white',
        isAnimating && 'bg-primary/10 scale-[1.02]',
        isDeleting && 'opacity-0 scale-95'
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
          <div className="relative">
            {task.completed ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
            {showConfetti && (
              <span className="absolute -top-1 -right-1 animate-fade-in">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              </span>
            )}
          </div>
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
            <div className={cn(
              "flex items-center text-xs px-2 py-0.5 rounded-full text-primary-foreground font-medium transition-all gap-1",
              isAnimating ? "bg-primary scale-110" : "bg-primary/20"
            )}>
              <span>{task.points}</span>
              <Star className="h-3 w-3" fill={isAnimating ? "currentColor" : "none"} />
            </div>
          </div>
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      
      {/* Confetti effect */}
      {showConfetti && (
        <div className="confetti-container absolute">
          {[...Array(10)].map((_, i) => {
            const size = Math.random() * 8 + 5;
            const left = Math.random() * 60;
            const animationDelay = Math.random() * 0.5;
            const backgroundColor = `hsl(${Math.random() * 360}, 80%, 60%)`;

            return (
              <div
                key={i}
                className="confetti absolute"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  left: `${left}%`,
                  backgroundColor,
                  animationDelay: `${animationDelay}s`,
                }}
              />
            );
          })}
        </div>
      )}

      <style>
        {`
        .confetti-container {
          pointer-events: none;
        }
        .confetti {
          animation: confettiDrop 1s ease-out forwards;
          border-radius: 50%;
          opacity: 0.8;
        }
        @keyframes confettiDrop {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(60px) rotate(360deg);
            opacity: 0;
          }
        }
        `}
      </style>
    </div>
  );
}
