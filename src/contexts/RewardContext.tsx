
import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState } from 'react';
import { Reward } from '@/types/Reward';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { useTask } from './TaskContext';
import { useToast } from '@/components/ui/use-toast';
import { useRewards, usePair, usePairPoints } from '@/hooks/use-supabase-data';
import { useRewardService, mapDbRewardToAppReward } from '@/services/rewardService';

interface RewardState {
  rewards: Reward[];
  spentPoints: number;
}

type RewardAction =
  | { type: 'ADD_REWARD'; payload: Omit<Reward, 'id' | 'claimed' | 'createdAt' | 'claimedAt'> }
  | { type: 'CLAIM_REWARD'; payload: { id: string } }
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
          ...state.rewards,
          {
            id: uuidv4(),
            claimed: false,
            createdAt: new Date(),
            ...action.payload,
          },
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

  const { isAuthenticated, user, showAuthRequiredToast } = useAuth();
  const { earnedPoints: localEarnedPoints } = useTask();
  const { toast } = useToast();
  
  const { data: pair } = usePair();
  const { data: dbRewards, isLoading: dbRewardsLoading } = useRewards(pair?.id);
  const { data: pairPoints } = usePairPoints(pair?.id);
  const rewardService = useRewardService(pair?.id);

  // Sync with Supabase when authenticated and we have DB rewards
  useEffect(() => {
    if (isAuthenticated && dbRewards && pair) {
      setLoadingRewards(true);
      
      // Map DB rewards to app format
      const appRewards = dbRewards.map(mapDbRewardToAppReward);
      
      // Update local state with DB rewards
      dispatch({ type: 'SYNC_DB_REWARDS', payload: appRewards });
      setLoadingRewards(false);
    }
  }, [isAuthenticated, dbRewards, pair]);

  // Update loading state based on DB loading
  useEffect(() => {
    if (isAuthenticated && pair) {
      setLoadingRewards(dbRewardsLoading);
    } else {
      setLoadingRewards(false);
    }
  }, [isAuthenticated, dbRewardsLoading, pair]);

  const addReward = async (reward: Omit<Reward, 'id' | 'claimed' | 'createdAt' | 'claimedAt'>) => {
    if (isAuthenticated && pair) {
      try {
        await rewardService.createReward(reward);
        toast({
          title: "Reward added!",
          description: `New reward "${reward.description}" added.`,
        });
        // Rewards will be updated via the useRewards hook's realtime subscription
      } catch (error) {
        // createReward already shows toast errors
        // Fallback to local state
        dispatch({ type: 'ADD_REWARD', payload: reward });
      }
    } else {
      dispatch({ type: 'ADD_REWARD', payload: reward });
      toast({
        title: "Reward added!",
        description: `New reward "${reward.description}" added.`,
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
      toast({
        title: "Not enough points",
        description: `You need ${reward.pointCost - availablePoints} more points to claim this reward.`,
        variant: "destructive",
      });
      return;
    }
    
    if (isAuthenticated && user && pair) {
      try {
        await rewardService.claimReward(id, user.id);
        toast({
          title: "Reward claimed!",
          description: `You've claimed: ${reward.description}`,
        });
        // Rewards will be updated via the useRewards hook's realtime subscription
      } catch (error) {
        // claimReward already shows toast errors
        // Fallback to local state
        dispatch({ type: 'CLAIM_REWARD', payload: { id } });
      }
    } else {
      dispatch({ type: 'CLAIM_REWARD', payload: { id } });
      toast({
        title: "Reward claimed!",
        description: `You've claimed: ${reward.description}`,
      });
    }
  };

  const deleteReward = async (id: string) => {
    if (!isAuthenticated) {
      showAuthRequiredToast();
      return;
    }

    if (isAuthenticated && pair) {
      try {
        await rewardService.deleteReward(id);
        // Rewards will be updated via the useRewards hook's realtime subscription
      } catch (error) {
        // deleteReward already shows toast errors
        // Fallback to local state
        dispatch({ type: 'DELETE_REWARD', payload: { id } });
      }
    } else {
      dispatch({ type: 'DELETE_REWARD', payload: { id } });
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
