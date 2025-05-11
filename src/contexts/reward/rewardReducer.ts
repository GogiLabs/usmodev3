
import { Reward } from '@/types/Reward';

// Types
export interface RewardState {
  rewards: Reward[];
  spentPoints: number;
}

export type RewardAction =
  | { type: 'ADD_REWARD'; payload: Reward }
  | { type: 'CLAIM_REWARD'; payload: { id: string, userId?: string } }
  | { type: 'DELETE_REWARD'; payload: { id: string } }
  | { type: 'LOAD_REWARDS'; payload: RewardState }
  | { type: 'SYNC_DB_REWARDS'; payload: Reward[] };

// Local storage key
export const REWARDS_STORAGE_KEY = 'usmode_rewards';

// Reward reducer function
export const rewardReducer = (state: RewardState, action: RewardAction): RewardState => {
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
