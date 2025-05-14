
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePairStatus } from "@/hooks/use-pair-status";
import { Reward } from "@/types/Reward";

// Helper function to map database reward to app reward model
const mapDbRewardToAppReward = (dbReward: any): Reward => {
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

export function useRewards() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { isPaired, pairData } = usePairStatus();

  useEffect(() => {
    if (!user) {
      setRewards([]);
      setLoading(false);
      return;
    }

    const fetchRewards = async () => {
      try {
        setLoading(true);
        
        let query = supabase
          .from('rewards')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false });
        
        // If paired, filter by pair_id
        if (isPaired && pairData) {
          query = query.eq('pair_id', pairData.pair_id);
        } else {
          // If not paired, get rewards created by this user
          // This is a fallback to show individual rewards when not paired
          const { data: userPairs } = await supabase
            .from('pairs')
            .select('id')
            .eq('user_1_id', user.id)
            .is('user_2_id', null)
            .limit(1);
            
          if (userPairs && userPairs.length > 0) {
            query = query.eq('pair_id', userPairs[0].id);
          }
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Transform database rewards to app rewards
        setRewards((data || []).map(mapDbRewardToAppReward));
      } catch (err: any) {
        console.error('Error fetching rewards:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };
    
    fetchRewards();
    
    // Set up realtime subscription
    const subscription = supabase
      .channel('rewards_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'rewards',
        filter: isPaired && pairData ? `pair_id=eq.${pairData.pair_id}` : undefined
      }, () => {
        fetchRewards();
      })
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [user, isPaired, pairData]);
  
  return { rewards, loading, error };
}
