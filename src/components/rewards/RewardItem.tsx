
import { Button } from "@/components/ui/button";
import { Reward } from "@/types/Reward";
import { useReward } from "@/contexts/RewardContext";
import { Gift, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface RewardItemProps {
  reward: Reward;
}

export function RewardItem({ reward }: RewardItemProps) {
  const { claimReward, deleteReward, canClaimReward } = useReward();
  const [isAnimating, setIsAnimating] = useState(false);
  
  const canClaim = canClaimReward(reward.pointCost) && !reward.claimed;

  const handleClaim = () => {
    if (canClaim) {
      setIsAnimating(true);
      claimReward(reward.id);
      
      // Reset animation state after animation completes
      setTimeout(() => setIsAnimating(false), 1000);
    }
  };

  return (
    <div 
      className={cn(
        "flex items-center justify-between p-4 border rounded-lg mb-2 transition-all duration-300",
        reward.claimed ? 'bg-muted' : 'bg-white',
        isAnimating && 'bg-primary/10 scale-[1.02]'
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
            "text-xs font-medium mt-1 transition-all",
            isAnimating ? "text-accent" : "text-muted-foreground"
          )}>
            {reward.pointCost} points
          </div>
        </div>
      </div>
      
      <div className="flex space-x-2">
        {!reward.claimed && (
          <Button
            variant={canClaim ? "outline" : "ghost"}
            size="sm"
            onClick={handleClaim}
            disabled={!canClaim}
            className={cn(
              "transition-all duration-300",
              canClaim && "border-primary text-primary hover:bg-primary/10",
              isAnimating && "scale-110 border-accent text-accent"
            )}
          >
            {canClaim ? "Claim" : "Not Enough Points"}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => deleteReward(reward.id)}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
