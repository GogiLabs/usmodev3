
import { useInviteAcceptanceState } from "./useInviteAcceptanceState";
import { validateInviteStatus, checkForExistingPair, useAuthValidation } from "./useInviteValidations";
import { updatePair, markInviteAsAccepted, checkUserPair } from "./useInvitePairUpdates";
import { supabase } from "@/integrations/supabase/client";

type InviteData = {
  pair_id?: string;
  sender_name?: string;
  sender_email?: string;
} | null;

export const useInviteAcceptance = (inviteId: string | null, inviteData: InviteData) => {
  const { 
    loading, 
    setLoading, 
    error, 
    clearError, 
    handleSuccess, 
    handleError,
    toast 
  } = useInviteAcceptanceState();
  
  const { validateAuth } = useAuthValidation();

  const acceptInvite = async () => {
    console.log("🔍 acceptInvite called with:", { inviteId, inviteData });
    
    if (!inviteId) {
      const errorMessage = "No invitation ID provided.";
      handleError(new Error(errorMessage));
      return null;
    }
    
    if (!inviteData?.pair_id) {
      const errorMessage = "Invalid invitation data.";
      handleError(new Error(errorMessage));
      return null;
    }
    
    try {
      setLoading(true);
      clearError();
      
      // Validate authentication
      try {
        const { user } = validateAuth();
        
        console.log("👤 Authenticated user for invite acceptance:", { userId: user.id });
        
        // Validate invitation status
        await validateInviteStatus(inviteId);
        
        // Check if user is already in a pair
        await checkForExistingPair(user.id, inviteData.pair_id);
        
        // Update pair with the user
        await updatePair(inviteData.pair_id, user.id);
        
        // Mark invitation as accepted
        await markInviteAsAccepted(inviteId);
        
        // Double check that the user is now in a pair
        const pairCheck = await checkUserPair(user.id);
        console.log("✅ Final pair verification after update:", pairCheck);
        
        if (!pairCheck.data) {
          console.warn("⚠️ User pair data not found after update, forcing refresh");
          
          // Try to explicitly refresh the view or cache
          try {
            const { error } = await supabase.rpc('refresh_pair_details');
            if (error) console.error("❌ Error refreshing pair details:", error);
          } catch (refreshError) {
            console.error("❌ Error calling refresh function:", refreshError);
          }
        }
        
        // Handle success and navigation
        handleSuccess(inviteData.sender_name);
        
        return 'accepted';
        
      } catch (authError: any) {
        toast({
          title: "Authentication Required",
          description: authError.message,
          variant: "destructive",
        });
        throw authError;
      }
      
    } catch (error: any) {
      handleError(error);
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
