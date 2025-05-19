
import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState, useCallback } from 'react';
import { Reward } from '@/types/Reward';
import { useAuth } from '../AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useRewards, usePair } from '@/hooks/use-supabase-data';
import { useRewardService, mapDbRewardToAppReward } from '@/services/rewardService';
import { toast as sonnerToast } from 'sonner';
import { rewardReducer, RewardState } from './rewardReducer';
import { createRewardWithDefaults, initializeRewardState } from './rewardUtils';
import { useUserPoints } from '@/hooks/use-user-points';

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
  const { toast } = useToast();
  const { points } = useUserPoints();
  
  const { data: pair } = usePair();
  const { data: dbRewards, isLoading: dbRewardsLoading, error: dbRewardsError, refetch: refetchDbRewards } = useRewards(pair?.id);
  const rewardService = useRewardService(pair?.id);

  // Refetch rewards function
  const refetchRewards = useCallback(() => {
    console.log('🔄 Manually refetching rewards');
    setRetryCount(prev => prev + 1);
    if (pair?.id) {
      refetchDbRewards();
    }
  }, [pair?.id, refetchDbRewards]);

  // Handle network errors
  useEffect(() => {
    if (dbRewardsError) {
      console.error('❌ Reward fetch error:', dbRewardsError);
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
        console.log(`📊 Syncing ${dbRewards.length} rewards from database`);
        
        // Map DB rewards to app format
        const appRewards = dbRewards.map(mapDbRewardToAppReward);
        
        // Update local state with DB rewards
        dispatch({ type: 'SYNC_DB_REWARDS', payload: appRewards });
      } catch (err) {
        console.error("❌ Error syncing rewards:", err);
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

  const addReward = async (reward: Omit<Reward, 'id' | 'claimed' | 'createdAt' | 'claimedAt'>) => {
    console.log('➕ Adding new reward:', reward);
    
    // Validate reward data
    if (!reward.description.trim()) {
      toast({
        title: "Reward description required",
        description: "Please enter a reward description",
        variant: "destructive",
      });
      return;
    }
    
    if (reward.pointCost < 1) {
      reward.pointCost = 1;
    }
    
    // Create reward object with default values
    const newReward = createRewardWithDefaults(reward);

    // Optimistically update UI
    dispatch({ type: 'ADD_REWARD', payload: newReward });

    if (isAuthenticated && pair) {
      try {
        console.log('🔄 Sending reward to database:', reward);
        const createdReward = await rewardService.createReward(reward);
        console.log('✅ Reward created in database:', createdReward);
        
        // Success toast
        sonnerToast.success("Reward added", {
          description: `"${reward.description}" has been added`
        });
      } catch (error: any) {
        console.error("❌ Error creating reward:", error);
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
    console.log('🎁 Claiming reward:', id);
    
    if (!isAuthenticated) {
      showAuthRequiredToast();
      return;
    }
    
    const reward = state.rewards.find(r => r.id === id);
    if (!reward) {
      console.error(`❌ Reward with ID ${id} not found`);
      return;
    }
    
    if (reward.claimed) {
      console.log('⚠️ Reward already claimed:', id);
      return;
    }
    
    // Check if user has enough points
    const availablePoints = points?.available_points || 0;
      
    if (reward.pointCost > availablePoints) {
      console.log(`⚠️ Not enough points to claim reward: needed ${reward.pointCost}, have ${availablePoints}`);
      sonnerToast.error("Not enough points", {
        description: `You need ${reward.pointCost - availablePoints} more points to claim this reward.`,
      });
      return;
    }
    
    // Optimistically update UI
    dispatch({ type: 'CLAIM_REWARD', payload: { id, userId: user?.id } });
    
    if (isAuthenticated && user && pair) {
      try {
        console.log('🔄 Marking reward as claimed in database:', id);
        const claimedReward = await rewardService.claimReward(id, user.id);
        console.log('✅ Reward claimed in database:', claimedReward);
        
        sonnerToast.success("Reward claimed!", {
          description: `You've claimed: ${reward.description}`,
        });
      } catch (error: any) {
        console.error("❌ Error claiming reward:", error);
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
    console.log('🗑️ Deleting reward:', id);
    
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
        console.log('🔄 Deleting reward from database:', id);
        await rewardService.deleteReward(id);
        console.log('✅ Reward deleted from database:', id);
        
        if (rewardToDelete) {
          sonnerToast.success("Reward deleted", {
            description: `"${rewardToDelete.description}" has been removed`
          });
        }
      } catch (error: any) {
        console.error("❌ Error deleting reward:", error);
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
    const availablePoints = points?.available_points || 0;      
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
