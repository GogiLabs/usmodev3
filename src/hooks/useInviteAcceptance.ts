
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type InviteData = {
  pair_id?: string;
  sender_name?: string;
  sender_email?: string;
} | null;

export const useInviteAcceptance = (inviteId: string | null, inviteData: InviteData) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const acceptInvite = async () => {
    if (!isAuthenticated || !user || !inviteId || !inviteData?.pair_id) {
      toast({
        title: "Error",
        description: "You must be logged in to accept this invitation.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Check if user is already in a pair
      const { data: existingPair } = await supabase
        .from('pairs')
        .select('id')
        .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`)
        .single();
      
      if (existingPair && existingPair.id !== inviteData.pair_id) {
        toast({
          title: "Already paired",
          description: "You are already paired with someone else.",
          variant: "destructive",
        });
        return;
      }
      
      // Begin transaction to update pair and invitation status
      const { error: updateError } = await supabase
        .from('pairs')
        .update({ user_2_id: user.id })
        .eq('id', inviteData.pair_id);
      
      if (updateError) {
        throw updateError;
      }
      
      // Mark invitation as accepted
      const { error: inviteError } = await supabase
        .from('invites')
        .update({ status: 'accepted' })
        .eq('id', inviteId);
      
      if (inviteError) {
        throw inviteError;
      }
      
      // Success!
      toast({
        title: "Invitation accepted!",
        description: `You are now connected with ${inviteData.sender_name || 'your partner'}.`,
      });
      
      // Navigate to the dashboard after a brief delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
      return 'accepted';
      
    } catch (error: any) {
      console.error("Error accepting invite:", error);
      toast({
        title: "Failed to accept invitation",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { acceptInvite, loading };
};
