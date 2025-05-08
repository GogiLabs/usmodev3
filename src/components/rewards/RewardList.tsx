
import { useReward } from "@/contexts/RewardContext";
import { RewardItem } from "./RewardItem";
import { RewardForm } from "./RewardForm";

export function RewardList() {
  const { rewards } = useReward();
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
