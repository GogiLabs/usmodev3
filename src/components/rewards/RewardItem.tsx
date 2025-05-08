
import { Button } from "@/components/ui/button";
import { Reward } from "@/types/Reward";
import { useReward } from "@/contexts/RewardContext";
import { Gift, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RewardItemProps {
  reward: Reward;
}

export function RewardItem({ reward }: RewardItemProps) {
  const { claimReward, deleteReward, canClaimReward } = useReward();
  
  const canClaim = canClaimReward(reward.pointCost) && !reward.claimed;

  return (
    <div className={`flex items-center justify-between p-4 border rounded-lg mb-2 ${reward.claimed ? 'bg-muted' : 'bg-white'}`}>
      <div className="flex items-center space-x-4">
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full",
          reward.claimed 
            ? "bg-primary/20" 
            : canClaim 
              ? "bg-primary/10" 
              : "bg-gray-100"
        )}>
          <Gift className={cn(
            "h-5 w-5",
            reward.claimed 
              ? "text-primary" 
              : canClaim 
                ? "text-accent" 
                : "text-muted-foreground"
          )} />
        </div>
        
        <div>
          <span className={reward.claimed ? "line-through text-muted-foreground" : ""}>
            {reward.description}
          </span>
          <div className="text-xs font-medium text-muted-foreground mt-1">
            {reward.pointCost} points
          </div>
        </div>
      </div>
      
      <div className="flex space-x-2">
        {!reward.claimed && (
          <Button
            variant={canClaim ? "outline" : "ghost"}
            size="sm"
            onClick={() => claimReward(reward.id)}
            disabled={!canClaim}
            className={cn(
              canClaim && "border-primary text-primary hover:bg-primary/10"
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
