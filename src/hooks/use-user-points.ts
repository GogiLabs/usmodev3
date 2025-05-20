import { useState, useEffect, useRef } from "react";
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
  
  const fetchUserPoints = async () => {
    if (!user) return;
    
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
      
      // Store the fetched points for comparison
      const previousPoints = lastFetchedPoints.current;
      lastFetchedPoints.current = newPoints;
  
      // Prevent initial animation trigger and only update if points actually changed
      setPoints(prev => {
        // On first load, just set the points without triggering animations
        if (!initialized.current) {
          initialized.current = true;
          return newPoints;
        }
        
        // If points changed, return the new points to trigger re-render and animations
        if (previousPoints === null || 
            previousPoints.available_points !== newPoints.available_points) {
          return { ...newPoints };
        }
        
        // No change, keep previous state
        return prev;
      });
    } catch (err: any) {
      console.error('Error fetching user points:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
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
      }, () => {
        fetchUserPoints();
      })
      .subscribe();
    
    return () => {
      channel.unsubscribe();
    };
  }, [user]);
  
  return { points, loading, error, refetch: fetchUserPoints };
}
