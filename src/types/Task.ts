
export type TaskTag = 
  | 'Cleaning'
  | 'Cooking'
  | 'Laundry'
  | 'Dishes'
  | 'GroceryShopping'
  | 'BillsAndFinances'
  | 'RepairsAndMaintenance'
  | 'PetCare'
  | 'Gardening'
  | 'Other';

export interface Task {
  id: string;
  description: string;
  points: number;
  tag: TaskTag;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
  completedBy?: string; // Will be used in future auth phase
}
