
import { useReward } from "@/contexts/reward/RewardContext";
import { RewardItem } from "./RewardItem";
import { RewardForm } from "./RewardForm";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Skeleton } from "@/components/ui/skeleton";
import { NetworkErrorAlert } from "@/components/common/NetworkErrorAlert";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { EmptyStateBanner } from "@/components/dashboard/EmptyStateBanner";
import { useAuth } from "@/contexts/AuthContext";
import { usePairDetails } from "@/hooks/use-supabase-data";
import { useState, useEffect } from "react";

export function RewardList() {
  const { rewards, loadingRewards, error, refetchRewards } = useReward();
  const { isAuthenticated } = useAuth();
  const { data: pairDetails } = usePairDetails();
  const [showEmptyState, setShowEmptyState] = useState(false);
  
  // Check if paired user banner should be shown
  const isPaired = pairDetails?.user_1_id && pairDetails?.user_2_id;
  
  // Show empty state banner after a delay if user is not paired
  // and there are no rewards and the user is authenticated
  useEffect(() => {
    if (isAuthenticated && !loadingRewards && rewards.length === 0 && !isPaired) {
      const timer = setTimeout(() => {
        setShowEmptyState(true);
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setShowEmptyState(false);
    }
  }, [isAuthenticated, loadingRewards, rewards.length, isPaired]);
  
  if (error) {
    return (
      <div className="h-full overflow-y-auto px-4 py-4">
        <NetworkErrorAlert 
          message={error.message || "Failed to load rewards. Please try again."} 
          onRetry={refetchRewards}
        />
        {rewards.length > 0 && (
          <div className="opacity-50">
            <h2 className="text-lg font-semibold mb-2">Showing cached data</h2>
            {rewards.map((reward) => (
              <RewardItem key={reward.id} reward={reward} />
            ))}
          </div>
        )}
      </div>
    );
  }
  
  if (loadingRewards) {
    return (
      <div className="h-full overflow-y-auto px-4 py-4">
        <div className="mb-4 flex justify-center">
          <LoadingSpinner text="Loading rewards..." />
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
    <ErrorBoundary>
      <div className="h-full overflow-y-auto px-4 py-4">
        {showEmptyState && <EmptyStateBanner />}
        
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
    </ErrorBoundary>
  );
}
