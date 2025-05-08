
export interface Reward {
  id: string;
  description: string;
  pointCost: number;
  claimed: boolean;
  createdAt: Date;
  claimedAt?: Date;
  claimedBy?: string; // Will be used in future auth phase
}
