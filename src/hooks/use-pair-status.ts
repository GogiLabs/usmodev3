import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PairData {
  partner_name: string | null;
  partner_avatar: string | null;
  pair_id: string;
  partner_id: string | null;
}

export function usePairStatus() {
  const [isPaired, setIsPaired] = useState<boolean>(false);
  const [pairData, setPairData] = useState<PairData | null>(null);
  const [pairLoading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchPairStatus = async () => {
      if (!user) {
        setIsPaired(false);
        setPairData(null);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const { data: pairDetails, error: pairError } = await supabase
          .from('pair_details')
          .select('*')
          .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`)
          .maybeSingle();
        
        if (pairError) {
          throw new Error(pairError.message);
        }
        
        if (pairDetails) {
          const isUser1 = pairDetails.user_1_id === user.id;
          const partnerId = isUser1 ? pairDetails.user_2_id : pairDetails.user_1_id;
          const partnerName = isUser1 ? pairDetails.user_2_name : pairDetails.user_1_name;
          const partnerAvatar = isUser1 ? pairDetails.user_2_avatar : pairDetails.user_1_avatar;
          
          // Only consider paired if both users exist in the pair
          setIsPaired(!!partnerId);
          
          setPairData({
            partner_name: partnerName,
            partner_avatar: partnerAvatar,
            pair_id: pairDetails.pair_id,
            partner_id: partnerId
          });
        } else {
          setIsPaired(false);
          setPairData(null);
        }
        
      } catch (err: any) {
        console.error("Error fetching pair status:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsPaired(false);
        setPairData(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPairStatus();
    
    // Set up a subscription to changes in the pair_details view
    const subscription = supabase
      .channel('pair_status_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'pairs'
      }, () => {
        fetchPairStatus();
      })
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [user]);
  
  return { isPaired, pairData, loading: pairLoading, pairLoading, error };
}
