
import { useReward } from "@/contexts/RewardContext";
import { RewardItem } from "./RewardItem";
import { RewardForm } from "./RewardForm";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function RewardList() {
  const { rewards, loadingRewards } = useReward();
  
  if (loadingRewards) {
    return (
      <div className="h-full overflow-y-auto px-4 py-4">
        <div className="mb-4 flex justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
        {/* Loading skeleton UI */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={`reward-skeleton-${i}`} className="flex items-center justify-between p-4 border rounded-lg mb-2">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="space-x-2 flex">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  const unclaimedRewards = rewards.filter(reward => !reward.claimed);
  const claimedRewards = rewards.filter(reward => reward.claimed);

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <RewardForm />
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Rewards</h2>
        {unclaimedRewards.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No rewards available. Add one!</p>
        ) : (
          unclaimedRewards.map((reward) => (
            <RewardItem key={reward.id} reward={reward} />
          ))
        )}
      </div>
      
      {claimedRewards.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Claimed</h2>
          {claimedRewards.map((reward) => (
            <RewardItem key={reward.id} reward={reward} />
          ))}
        </div>
      )}
    </div>
  );
}
