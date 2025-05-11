
import { Reward } from '@/types/Reward';
import { v4 as uuidv4 } from 'uuid';
import { RewardState, REWARDS_STORAGE_KEY } from './rewardReducer';

// Create a new reward with default values
export const createRewardWithDefaults = (
  reward: Omit<Reward, 'id' | 'claimed' | 'createdAt' | 'claimedAt'>
): Reward => {
  return {
    id: uuidv4(),
    claimed: false,
    createdAt: new Date(),
    ...reward
  };
};

// Initialize state from localStorage or with default values
export const initializeRewardState = (): RewardState => {
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
