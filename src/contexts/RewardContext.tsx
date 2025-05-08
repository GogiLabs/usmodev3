
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Reward } from '@/types/Reward';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { useTask } from './TaskContext';
import { useToast } from '@/components/ui/use-toast';

interface RewardState {
  rewards: Reward[];
  spentPoints: number;
}

type RewardAction =
  | { type: 'ADD_REWARD'; payload: Omit<Reward, 'id' | 'claimed' | 'createdAt' | 'claimedAt'> }
  | { type: 'CLAIM_REWARD'; payload: { id: string } }
  | { type: 'DELETE_REWARD'; payload: { id: string } };

interface RewardContextType {
  rewards: Reward[];
  spentPoints: number;
  addReward: (reward: Omit<Reward, 'id' | 'claimed' | 'createdAt' | 'claimedAt'>) => void;
  claimReward: (id: string) => void;
  deleteReward: (id: string) => void;
  canClaimReward: (pointCost: number) => boolean;
}

const RewardContext = createContext<RewardContextType | undefined>(undefined);

const rewardReducer = (state: RewardState, action: RewardAction): RewardState => {
  switch (action.type) {
    case 'ADD_REWARD':
      return {
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

      return {
        rewards: updatedRewards,
        spentPoints: state.spentPoints + pointsToSpend,
      };
    }
    case 'DELETE_REWARD':
      return {
        ...state,
        rewards: state.rewards.filter((reward) => reward.id !== action.payload.id),
      };
    default:
      return state;
  }
};

export const RewardProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(rewardReducer, {
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
  });

  const { isAuthenticated, showAuthRequiredToast } = useAuth();
  const { earnedPoints } = useTask();
  const { toast } = useToast();

  const addReward = (reward: Omit<Reward, 'id' | 'claimed' | 'createdAt' | 'claimedAt'>) => {
    dispatch({ type: 'ADD_REWARD', payload: reward });
  };

  const claimReward = (id: string) => {
    if (!isAuthenticated) {
      showAuthRequiredToast();
      return;
    }
    
    const reward = state.rewards.find(r => r.id === id);
    if (!reward) return;
    
    const availablePoints = earnedPoints - state.spentPoints;
    if (reward.pointCost > availablePoints) {
      toast({
        title: "Not enough points",
        description: `You need ${reward.pointCost - availablePoints} more points to claim this reward.`,
        variant: "destructive",
      });
      return;
    }
    
    dispatch({ type: 'CLAIM_REWARD', payload: { id } });
    toast({
      title: "Reward claimed!",
      description: `You've claimed: ${reward.description}`,
    });
  };

  const deleteReward = (id: string) => {
    dispatch({ type: 'DELETE_REWARD', payload: { id } });
  };

  const canClaimReward = (pointCost: number): boolean => {
    return (earnedPoints - state.spentPoints) >= pointCost;
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
