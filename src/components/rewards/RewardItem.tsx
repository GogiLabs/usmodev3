import { Button } from "@/components/ui/button";
import { Reward } from "@/types/Reward";
import { useReward } from "@/contexts/reward/RewardContext";
import { Gift, Sparkles, Trash2, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface RewardItemProps {
  reward: Reward;
}

export function RewardItem({ reward }: RewardItemProps) {
  const { claimReward, deleteReward, canClaimReward, refetchPoints } = useReward();
  const { isAuthenticated, showAuthRequiredToast } = useAuth();
  const [isAnimating, setIsAnimating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isMobile = useIsMobile();
  
  const canClaim = canClaimReward(reward.pointCost) && !reward.claimed;
  
  // Reset animation state when reward changes
  useEffect(() => {
    setIsAnimating(false);
    setShowConfetti(false);
    setIsDeleting(false);
  }, [reward.id]);

  const handleClaim = async () => {
    if (!isAuthenticated) {
      showAuthRequiredToast();
      return;
    }
    
    if (canClaim) {
      setIsAnimating(true);
      setShowConfetti(true);
      await claimReward(reward.id);
      
      // Make sure to refetch points after claiming a reward
      refetchPoints();
      
      // Show success toast
      toast(`Reward Claimed!`, {
        description: `You've claimed "${reward.description}" for ${reward.pointCost} points.`,
      });
      
      // Reset animation state after animation completes
      setTimeout(() => {
        setIsAnimating(false);
        setTimeout(() => setShowConfetti(false), 500);
      }, 1000);
    } else if (!canClaim && !reward.claimed) {
      toast.error("Not enough points", {
        description: `You need more points to claim this reward.`,
      });
    }
  };
  
  const handleDelete = async () => {
    if (!isAuthenticated) {
      showAuthRequiredToast();
      return;
    }
    
    setIsDeleting(true);
    
    // Add small delay for animation
    await deleteReward(reward.id);
    
    // If the reward was claimed, refetch points as deleting a claimed reward might affect points
    if (reward.claimed) {
      refetchPoints();
    }
  };

  // Render for mobile devices
  if (isMobile) {
    return (
      <div 
        className={cn(
          "flex flex-col p-4 border rounded-lg mb-3 transition-all duration-300",
          reward.claimed ? 'bg-muted/50' : 'bg-white',
          isAnimating && 'bg-primary/10 scale-[1.02]',
          isDeleting && 'opacity-0 scale-95'
        )}
      >
        {/* Reward header with icon and delete button */}
        <div className="flex items-center justify-between mb-3">
          <div className={cn(
            "relative flex items-center justify-center w-10 h-10 rounded-full transition-colors",
            reward.claimed 
              ? "bg-primary/20" 
              : canClaim 
                ? "bg-primary/10" 
                : "bg-gray-100",
            isAnimating && "bg-primary/30"
          )}>
            <Gift className={cn(
              "h-5 w-5 transition-all",
              reward.claimed 
                ? "text-primary" 
                : canClaim 
                  ? "text-accent" 
                  : "text-muted-foreground",
              isAnimating && "scale-110 text-accent"
            )} />
            {isAnimating && (
              <Sparkles className="h-4 w-4 absolute -top-1 -right-1 text-accent animate-pulse" />
            )}
          </div>
          
          {/* Delete button with confirmation dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive p-2 h-auto"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-[90vw]">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Reward</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{reward.description}"?
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex gap-2">
                <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} 
                  className="bg-destructive hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        
        {/* Reward content */}
        <div className="flex flex-col space-y-2 px-1">
          <span className={cn(
            "text-sm font-medium",
            reward.claimed ? "line-through text-muted-foreground" : "",
            isAnimating && "text-accent"
          )}>
            {reward.description}
          </span>
          
          <div className="flex items-center justify-between">
            <div className={cn(
              "flex items-center text-xs font-medium gap-1 transition-all",
              isAnimating ? "text-accent" : "text-muted-foreground"
            )}>
              <span>{reward.pointCost}</span>
              <Star className="h-3 w-3" fill={isAnimating ? "currentColor" : "none"} />
            </div>
            
            {!reward.claimed && (
              <Button
                variant={canClaim ? "outline" : "ghost"}
                size="sm"
                onClick={handleClaim}
                disabled={!canClaim && isAuthenticated}
                className={cn(
                  "transition-all duration-300",
                  canClaim && "border-primary text-primary hover:bg-primary/10",
                  isAnimating && "scale-110 border-accent text-accent"
                )}
              >
                {canClaim ? "Claim" : "Need More Points"}
              </Button>
            )}
          </div>
        </div>
        
        {/* Confetti effect */}
        {showConfetti && (
          <div className="confetti-container absolute">
            {[...Array(15)].map((_, i) => {
              const size = Math.random() * 8 + 5;
              const left = Math.random() * 80;
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

  // Desktop view
  return (
    <div 
      className={cn(
        "flex items-center justify-between p-4 border rounded-lg mb-2 transition-all duration-300",
        reward.claimed ? 'bg-muted/50' : 'bg-white',
        isAnimating && 'bg-primary/10 scale-[1.02]',
        isDeleting && 'opacity-0 scale-95'
      )}
    >
      <div className="flex items-center space-x-4">
        <div className={cn(
          "relative flex items-center justify-center w-10 h-10 rounded-full transition-colors",
          reward.claimed 
            ? "bg-primary/20" 
            : canClaim 
              ? "bg-primary/10" 
              : "bg-gray-100",
          isAnimating && "bg-primary/30"
        )}>
          <Gift className={cn(
            "h-5 w-5 transition-all",
            reward.claimed 
              ? "text-primary" 
              : canClaim 
                ? "text-accent" 
                : "text-muted-foreground",
            isAnimating && "scale-110 text-accent"
          )} />
          {isAnimating && (
            <Sparkles className="h-4 w-4 absolute -top-1 -right-1 text-accent animate-pulse" />
          )}
        </div>
        
        <div>
          <span className={cn(
            reward.claimed ? "line-through text-muted-foreground" : "",
            isAnimating && "text-accent font-medium"
          )}>
            {reward.description}
          </span>
          <div className={cn(
            "flex items-center text-xs mt-1 font-medium gap-1 transition-all",
            isAnimating ? "text-accent" : "text-muted-foreground"
          )}>
            <span>{reward.pointCost}</span>
            <Star className="h-3 w-3" fill={isAnimating ? "currentColor" : "none"} />
          </div>
        </div>
      </div>
      
      <div className="flex space-x-2">
        {!reward.claimed && (
          <Button
            variant={canClaim ? "outline" : "ghost"}
            size="sm"
            onClick={handleClaim}
            disabled={!canClaim && isAuthenticated}
            className={cn(
              "transition-all duration-300",
              canClaim && "border-primary text-primary hover:bg-primary/10",
              isAnimating && "scale-110 border-accent text-accent"
            )}
          >
            {canClaim ? "Claim" : "Not Enough Points"}
          </Button>
        )}
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Reward</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{reward.description}"?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} 
                className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      
      {/* Confetti effect */}
      {showConfetti && (
        <div className="confetti-container absolute">
          {[...Array(15)].map((_, i) => {
            const size = Math.random() * 8 + 5;
            const left = Math.random() * 80;
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
