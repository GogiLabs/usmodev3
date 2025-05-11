import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState, useCallback } from 'react';
import { Reward } from '@/types/Reward';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { useTask } from './TaskContext';
import { useToast } from '@/components/ui/use-toast';
import { useRewards, usePair, usePairPoints } from '@/hooks/use-supabase-data';
import { useRewardService, mapDbRewardToAppReward } from '@/services/rewardService';
import { useOptimisticUpdate } from '@/hooks/use-optimistic-update';
import { toast as sonnerToast } from 'sonner';

interface RewardState {
  rewards: Reward[];
  spentPoints: number;
}

type RewardAction =
  | { type: 'ADD_REWARD'; payload: Reward }
  | { type: 'CLAIM_REWARD'; payload: { id: string, userId?: string } }
  | { type: 'DELETE_REWARD'; payload: { id: string } }
  | { type: 'LOAD_REWARDS'; payload: RewardState }
  | { type: 'SYNC_DB_REWARDS'; payload: Reward[] };

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

// Local storage key
const REWARDS_STORAGE_KEY = 'usmode_rewards';

const rewardReducer = (state: RewardState, action: RewardAction): RewardState => {
  let updatedState: RewardState;
  
  switch (action.type) {
    case 'ADD_REWARD':
      updatedState = {
        ...state,
        rewards: [
          action.payload,
          ...state.rewards,
        ],
      };
      break;
      
    case 'CLAIM_REWARD': {
      const updatedRewards = state.rewards.map((reward) => {
        if (reward.id === action.payload.id && !reward.claimed) {
          return {
            ...reward,
            claimed: true,
            claimedAt: new Date(),
            claimedBy: action.payload.userId
          };
        }
        return reward;
      });

      // Calculate spent points
      const claimedReward = state.rewards.find(
        (reward) => reward.id === action.payload.id && !reward.claimed
      );
      const pointsToSpend = claimedReward ? claimedReward.pointCost : 0;

      updatedState = {
        rewards: updatedRewards,
        spentPoints: state.spentPoints + pointsToSpend,
      };
      break;
    }
    
    case 'DELETE_REWARD':
      updatedState = {
        ...state,
        rewards: state.rewards.filter((reward) => reward.id !== action.payload.id),
      };
      break;
      
    case 'LOAD_REWARDS':
      updatedState = action.payload;
      break;
      
    case 'SYNC_DB_REWARDS':
      updatedState = {
        rewards: action.payload,
        // Calculate spent points from claimed rewards
        spentPoints: action.payload.reduce(
          (total, reward) => total + (reward.claimed ? reward.pointCost : 0), 0
        ),
      };
      break;
      
    default:
      return state;
  }
  
  // Save to localStorage whenever state changes (but only if not using DB)
  localStorage.setItem(REWARDS_STORAGE_KEY, JSON.stringify(updatedState));
  return updatedState;
};

// Initialize state from localStorage or with default values
const initializeState = (): RewardState => {
  const storedState = localStorage.getItem(REWARDS_STORAGE_KEY);
  
  if (storedState) {
    try {
      const parsedState = JSON.parse(storedState);
      
      // Convert string dates back to Date objects
      const rewardsWithDates = parsedState.rewards.map((reward: any) => ({
        ...reward,
        createdAt: new Date(reward.createdAt),
        claimedAt: reward.claimedAt ? new Date(reward.claimedAt) : undefined,
      }));
      
      return {
        ...parsedState,
        rewards: rewardsWithDates,
      };
    } catch (error) {
      console.error('Error parsing stored rewards:', error);
    }
  }
  
  // Default initial state
  return {
    rewards: [
      {
        id: uuidv4(),
        description: "Movie night",
        pointCost: 20,
        claimed: false,
        createdAt: new Date(),
      },
      {
        id: uuidv4(),
        description: "Restaurant dinner",
        pointCost: 50,
        claimed: false,
        createdAt: new Date(),
      },
      {
        id: uuidv4(),
        description: "Weekend getaway",
        pointCost: 200,
        claimed: false,
        createdAt: new Date(),
      },
    ],
    spentPoints: 0,
  };
};

export const RewardProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(rewardReducer, null, initializeState);
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
    const newReward: Reward = {
      id: uuidv4(),
      claimed: false,
      createdAt: new Date(),
      ...reward
    };

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
