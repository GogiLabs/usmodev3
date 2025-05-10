
import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProfileUpdate } from './types';

export const useProfileUpdates = (user: User | null) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const updateUserProfile = async (updates: ProfileUpdate) => {
    try {
      if (!user) throw new Error("User not authenticated");
      setLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
        
      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateLastActive = async () => {
    if (!user) return;
    
    await supabase
      .from('profiles')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', user.id);
  };

  return { updateUserProfile, updateLastActive, loading };
};
