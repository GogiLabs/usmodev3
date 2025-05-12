
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
  const [error, setError] = useState<Error | null>(null);

  const clearError = () => setError(null);

  const acceptInvite = async () => {
    if (!isAuthenticated || !user) {
      const errorMessage = "You must be logged in to accept this invitation.";
      setError(new Error(errorMessage));
      
      toast({
        title: "Authentication Required",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
    
    if (!inviteId) {
      const errorMessage = "No invitation ID provided.";
      setError(new Error(errorMessage));
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
    
    if (!inviteData?.pair_id) {
      const errorMessage = "Invalid invitation data.";
      setError(new Error(errorMessage));
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
    
    try {
      setLoading(true);
      clearError();
      
      // Check invitation status once more before accepting
      const { data: invite, error: checkError } = await supabase
        .from('invites')
        .select('status, expires_at')
        .eq('id', inviteId)
        .maybeSingle();
      
      if (checkError) {
        throw new Error(checkError.message || "Failed to verify invitation status");
      }
      
      if (!invite) {
        throw new Error("Invitation not found");
      }
      
      if (invite.status === 'expired' || new Date(invite.expires_at) < new Date()) {
        throw new Error("This invitation has expired");
      }
      
      if (invite.status === 'accepted') {
        throw new Error("This invitation has already been accepted");
      }
      
      // Check if user is already in a pair
      const { data: existingPair, error: pairError } = await supabase
        .from('pairs')
        .select('id')
        .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`)
        .maybeSingle();
      
      if (pairError && pairError.code !== 'PGRST116') {
        // PGRST116 means "no rows returned" which is actually what we want
        throw new Error(pairError.message || "Failed to check existing pairs");
      }
      
      if (existingPair && existingPair.id !== inviteData.pair_id) {
        throw new Error("You are already paired with someone else.");
      }
      
      // Begin transaction to update pair and invitation status
      const { error: updateError } = await supabase
        .from('pairs')
        .update({ user_2_id: user.id })
        .eq('id', inviteData.pair_id);
      
      if (updateError) {
        throw new Error(updateError.message || "Failed to update pair");
      }
      
      // Mark invitation as accepted
      const { error: inviteError } = await supabase
        .from('invites')
        .update({ status: 'accepted' })
        .eq('id', inviteId);
      
      if (inviteError) {
        throw new Error(inviteError.message || "Failed to update invitation status");
      }
      
      // Success!
      toast({
        title: "Invitation accepted!",
        description: `You are now connected with ${inviteData.sender_name || 'your partner'}.`,
      });
      
      return 'accepted';
      
    } catch (error: any) {
      console.error("Error accepting invite:", error);
      const errorMessage = error.message || "An unexpected error occurred";
      
      setError(error instanceof Error ? error : new Error(errorMessage));
      
      toast({
        title: "Failed to accept invitation",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { 
    acceptInvite, 
    loading, 
    error,
    clearError
  };
};
