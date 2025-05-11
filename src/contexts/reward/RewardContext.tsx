
import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState, useCallback } from 'react';
import { Reward } from '@/types/Reward';
import { useAuth } from '../AuthContext';
import { useTask } from '../task/TaskContext';
import { useToast } from '@/components/ui/use-toast';
import { useRewards, usePair, usePairPoints } from '@/hooks/use-supabase-data';
import { useRewardService, mapDbRewardToAppReward } from '@/services/rewardService';
import { useOptimisticUpdate } from '@/hooks/use-optimistic-update';
import { toast as sonnerToast } from 'sonner';
import { rewardReducer, RewardState, RewardAction } from './rewardReducer';
import { createRewardWithDefaults, initializeRewardState } from './rewardUtils';

// Define the context type
interface RewardContextType {
  rewards: Reward[];
  spentPoints: number;
  addReward: (reward: Omit<Reward, 'id' | 'claimed' | 'createdAt' | 'claimedAt'>) => void;
  claimReward: (id: string) => void;
  deleteReward: (id: string) => void;
  canClaimReward: (pointCost: number) => boolean;
  loadingRewards: boolean;
  error: Error | null;
  refetchRewards: () => void;
}

const RewardContext = createContext<RewardContextType | undefined>(undefined);

export const RewardProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(rewardReducer, null, initializeRewardState);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const { isAuthenticated, user, showAuthRequiredToast } = useAuth();
  const { earnedPoints: localEarnedPoints } = useTask();
  const { toast } = useToast();
  
  const { data: pair } = usePair();
  const { data: dbRewards, isLoading: dbRewardsLoading, error: dbRewardsError } = useRewards(pair?.id);
  const { data: pairPoints } = usePairPoints(pair?.id);
  const rewardService = useRewardService(pair?.id);

  // Refetch rewards function
  const refetchRewards = useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);

  // Handle network errors
  useEffect(() => {
    if (dbRewardsError) {
      setError(new Error(dbRewardsError.message || "Failed to load rewards"));
    } else {
      setError(null);
    }
  }, [dbRewardsError, retryCount]);

  // Sync with Supabase when authenticated and we have DB rewards
  useEffect(() => {
    if (isAuthenticated && dbRewards && pair) {
      setLoadingRewards(true);
      
      try {
        // Map DB rewards to app format
        const appRewards = dbRewards.map(mapDbRewardToAppReward);
        
        // Update local state with DB rewards
        dispatch({ type: 'SYNC_DB_REWARDS', payload: appRewards });
      } catch (err) {
        console.error("Error syncing rewards:", err);
        setError(err instanceof Error ? err : new Error("Failed to process rewards data"));
      } finally {
        setLoadingRewards(false);
      }
    }
  }, [isAuthenticated, dbRewards, pair, retryCount]);

  // Update loading state based on DB loading
  useEffect(() => {
    if (isAuthenticated && pair) {
      setLoadingRewards(dbRewardsLoading);
    } else {
      setLoadingRewards(false);
    }
  }, [isAuthenticated, dbRewardsLoading, pair]);

  // Setup optimistic updates
  const { execute: executeAddReward } = useOptimisticUpdate(
    async (reward: Omit<Reward, 'id' | 'claimed' | 'createdAt' | 'claimedAt'>) => {
      if (!pair?.id) {
        throw new Error("Cannot create reward: No pair ID");
      }
      return await rewardService.createReward(reward);
    }
  );

  const { execute: executeClaimReward } = useOptimisticUpdate(
    async (params: { rewardId: string, userId: string }) => {
      return await rewardService.claimReward(params.rewardId, params.userId);
    }
  );

  const { execute: executeDeleteReward } = useOptimisticUpdate(
    async (rewardId: string) => {
      await rewardService.deleteReward(rewardId);
      return rewardId;
    }
  );

  const addReward = async (reward: Omit<Reward, 'id' | 'claimed' | 'createdAt' | 'claimedAt'>) => {
    // Create reward object with default values
    const newReward = createRewardWithDefaults(reward);

    // Optimistically update UI
    dispatch({ type: 'ADD_REWARD', payload: newReward });

    if (isAuthenticated && pair) {
      try {
        await rewardService.createReward(reward);
        // Success toast
        sonnerToast.success("Reward added", {
          description: `"${reward.description}" has been added`
        });
        // Rewards will be updated via the useRewards hook's realtime subscription
      } catch (error: any) {
        console.error("Error creating reward:", error);
        toast({
          title: "Error creating reward",
          description: error.message,
          variant: "destructive",
        });
      }
    } else if (!isAuthenticated) {
      sonnerToast.success("Reward added", {
        description: `"${reward.description}" has been added`
      });
    }
  };

  const claimReward = async (id: string) => {
    if (!isAuthenticated) {
      showAuthRequiredToast();
      return;
    }
    
    const reward = state.rewards.find(r => r.id === id);
    if (!reward) return;
    
    // Check if user has enough points
    const availablePoints = isAuthenticated && pairPoints 
      ? pairPoints.available 
      : localEarnedPoints - state.spentPoints;
      
    if (reward.pointCost > availablePoints) {
      sonnerToast.error("Not enough points", {
        description: `You need ${reward.pointCost - availablePoints} more points to claim this reward.`,
      });
      return;
    }
    
    // Optimistically update UI
    dispatch({ type: 'CLAIM_REWARD', payload: { id, userId: user?.id } });
    
    if (isAuthenticated && user && pair) {
      try {
        await rewardService.claimReward(id, user.id);
        
        sonnerToast.success("Reward claimed!", {
          description: `You've claimed: ${reward.description}`,
        });
        // Rewards will be updated via the useRewards hook's realtime subscription
      } catch (error: any) {
        console.error("Error claiming reward:", error);
        toast({
          title: "Error claiming reward",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      sonnerToast.success("Reward claimed!", {
        description: `You've claimed: ${reward.description}`,
      });
    }
  };

  const deleteReward = async (id: string) => {
    if (!isAuthenticated) {
      showAuthRequiredToast();
      return;
    }

    // Find the reward to be deleted for showing in toast
    const rewardToDelete = state.rewards.find(r => r.id === id);
    
    // Optimistically update UI
    dispatch({ type: 'DELETE_REWARD', payload: { id } });
    
    if (isAuthenticated && pair) {
      try {
        await rewardService.deleteReward(id);
        
        if (rewardToDelete) {
          sonnerToast.success("Reward deleted", {
            description: `"${rewardToDelete.description}" has been removed`
          });
        }
        // Rewards will be updated via the useRewards hook's realtime subscription
      } catch (error: any) {
        console.error("Error deleting reward:", error);
        toast({
          title: "Error deleting reward",
          description: error.message,
          variant: "destructive",
        });
      }
    } else if (rewardToDelete) {
      sonnerToast.success("Reward deleted", {
        description: `"${rewardToDelete.description}" has been removed`
      });
    }
  };

  const canClaimReward = (pointCost: number): boolean => {
    const availablePoints = isAuthenticated && pairPoints 
      ? pairPoints.available 
      : localEarnedPoints - state.spentPoints;
      
    return availablePoints >= pointCost;
  };

  return (
    <RewardContext.Provider
      value={{
        rewards: state.rewards,
        spentPoints: state.spentPoints,
        addReward,
        claimReward,
        deleteReward,
        canClaimReward,
        loadingRewards,
        error,
        refetchRewards
      }}
    >
      {children}
    </RewardContext.Provider>
  );
};

export const useReward = () => {
  const context = useContext(RewardContext);
  if (context === undefined) {
    throw new Error('useReward must be used within a RewardProvider');
  }
  return context;
};
