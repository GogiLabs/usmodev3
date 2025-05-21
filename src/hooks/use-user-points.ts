
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserPoints {
  earned_points: number;
  spent_points: number;
  available_points: number;
}

export function useUserPoints() {
  const [points, setPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const initialized = useRef(false);
  const lastFetchedPoints = useRef<UserPoints | null>(null);
  const fetchCounter = useRef(0);
  
  const fetchUserPoints = useCallback(async (forceUpdate = false) => {
    if (!user) return;
    
    // Increment counter each time fetch is called
    fetchCounter.current += 1;
    const fetchId = fetchCounter.current;
    console.log(`🔄 [useUserPoints] Fetching points (#${fetchId}) for user: ${user.id}`);
    
    try {
      setLoading(true);
      
      // Call the get_user_points function to get user points summary
      const { data, error } = await supabase
        .rpc('get_user_points', { user_id_param: user.id });
      
      if (error) throw error;
      
      const newPoints: UserPoints = data && data.length > 0 ? data[0] : {
        earned_points: 0,
        spent_points: 0,
        available_points: 0
      };
      
      console.log(`✅ [useUserPoints] Points fetched (#${fetchId}):`, newPoints);
      
      // Store the fetched points for comparison
      const previousPoints = lastFetchedPoints.current;
      lastFetchedPoints.current = newPoints;
  
      // Always update points on force update to trigger animations
      if (forceUpdate) {
        console.log(`🔄 [useUserPoints] Force updating points from ${previousPoints?.available_points} to ${newPoints.available_points}`);
        setPoints({...newPoints}); // Create new object to ensure React detects the change
        initialized.current = true;
        return;
      }
      
      // Update points state, with special handling for different scenarios
      setPoints(prev => {
        // On first load, just set the points without triggering animations
        if (!initialized.current) {
          initialized.current = true;
          console.log(`🏁 [useUserPoints] First load complete with points:`, newPoints);
          return newPoints;
        }
        
        // If points changed, return new points to trigger re-render
        if (previousPoints === null || 
            previousPoints.available_points !== newPoints.available_points) {
          console.log(`🔄 [useUserPoints] Points changed from ${previousPoints?.available_points} to ${newPoints.available_points}`);
          return { ...newPoints };
        }
        
        // No change, keep previous state
        console.log(`🛑 [useUserPoints] No change in points, keeping previous state`);
        return prev;
      });
    } catch (err: any) {
      console.error('❌ [useUserPoints] Error fetching user points:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    console.log(`🔍 [useUserPoints] Hook initialized/updated with user:`, user?.id);
    if (!user) {
      console.log(`⚠️ [useUserPoints] No user found, clearing points`);
      setPoints(null);
      setLoading(false);
      return;
    }

    fetchUserPoints();
    
    // Set up realtime subscription for point changes
    const channel = supabase
      .channel('user_points_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'user_points',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('📣 [useUserPoints] Realtime update received:', payload);
        fetchUserPoints(true); // Force update for realtime events to trigger animations
      })
      .subscribe();
    
    console.log(`🎧 [useUserPoints] Subscribed to realtime updates for user ${user.id}`);
    
    return () => {
      channel.unsubscribe();
      console.log(`🔌 [useUserPoints] Unsubscribed from realtime updates`);
    };
  }, [user, fetchUserPoints]);
  
  // Create a wrapped refetch function with logging
  const refetch = useCallback(() => {
    console.log(`🔄 [useUserPoints] Manual refetch called`);
    return fetchUserPoints(true); // Force update on manual refetch
  }, [fetchUserPoints]);
  
  return { points, loading, error, refetch };
}
