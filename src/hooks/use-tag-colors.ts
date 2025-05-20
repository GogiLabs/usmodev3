
import { TaskTag } from '@/types/Task';

/**
 * Hook to get tag colors
 */
export function useTagColors() {
  // Get a color for a task tag
  const getTagColor = (tag: TaskTag): string => {
    switch (tag) {
      case 'Cleaning':
        return 'bg-blue-100 text-blue-800';
      case 'Cooking':
        return 'bg-orange-100 text-orange-800';
      case 'Laundry':
        return 'bg-purple-100 text-purple-800';
      case 'Dishes':
        return 'bg-cyan-100 text-cyan-800';
      case 'GroceryShopping':
        return 'bg-green-100 text-green-800';
      case 'BillsAndFinances':
        return 'bg-amber-100 text-amber-800';
      case 'RepairsAndMaintenance':
        return 'bg-stone-100 text-stone-800';
      case 'PetCare':
        return 'bg-pink-100 text-pink-800';
      case 'Gardening':
        return 'bg-emerald-100 text-emerald-800';
      case 'Other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return { getTagColor };
}
