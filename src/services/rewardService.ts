
import { supabase } from "@/integrations/supabase/client";
import { Reward } from "@/types/Reward";
import { useSoftDelete } from "@/hooks/use-soft-delete";
import { useToast } from "@/components/ui/use-toast";

// Convert database reward to app reward format
export const mapDbRewardToAppReward = (dbReward: any): Reward => {
  return {
    id: dbReward.id,
    description: dbReward.description,
    pointCost: dbReward.point_cost,
    claimed: dbReward.claimed,
    createdAt: new Date(dbReward.created_at),
    claimedAt: dbReward.claimed_at ? new Date(dbReward.claimed_at) : undefined,
    claimedBy: dbReward.claimed_by,
  };
};

// Convert app reward to database format for insertion
export const mapAppRewardToDbReward = (
  reward: Omit<Reward, 'id' | 'claimed' | 'createdAt' | 'claimedAt'>, 
  pairId: string
) => {
  return {
    description: reward.description,
    point_cost: reward.pointCost,
    pair_id: pairId,
    claimed: false,
  };
};

export const useRewardService = (pairId?: string) => {
  const { softDelete } = useSoftDelete();
  const { toast } = useToast();

  const createReward = async (reward: Omit<Reward, 'id' | 'claimed' | 'createdAt' | 'claimedAt'>) => {
    if (!pairId) {
      throw new Error("Cannot create reward: No pair ID");
    }

    try {
      const dbReward = mapAppRewardToDbReward(reward, pairId);
      const { data, error } = await supabase.from('rewards').insert(dbReward).select().single();
      
      if (error) throw error;
      return mapDbRewardToAppReward(data);
    } catch (error: any) {
      console.error("Error creating reward:", error);
      toast({
        title: "Error creating reward",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const claimReward = async (rewardId: string, userId: string) => {
    try {
      const { data, error } = await supabase.from('rewards')
        .update({
          claimed: true,
          claimed_at: new Date().toISOString(),
          claimed_by: userId
        })
        .eq('id', rewardId)
        .select()
        .single();
      
      if (error) throw error;
      return mapDbRewardToAppReward(data);
    } catch (error: any) {
      console.error("Error claiming reward:", error);
      toast({
        title: "Error claiming reward",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteReward = async (rewardId: string) => {
    try {
      await softDelete('rewards', rewardId);
    } catch (error: any) {
      console.error("Error deleting reward:", error);
      toast({
        title: "Error deleting reward",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    createReward,
    claimReward,
    deleteReward,
  };
};
