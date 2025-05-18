
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
    console.log("🔍 [useInviteAcceptance] acceptInvite called with:", { inviteId, inviteData });
    
    if (!inviteId) {
      const errorMessage = "No invitation ID provided.";
      console.error("❌ [useInviteAcceptance] Error:", errorMessage);
      handleError(new Error(errorMessage));
      return null;
    }
    
    if (!inviteData?.pair_id) {
      const errorMessage = "Invalid invitation data.";
      console.error("❌ [useInviteAcceptance] Error:", errorMessage);
      handleError(new Error(errorMessage));
      return null;
    }
    
    try {
      setLoading(true);
      clearError();
      
      // Validate authentication
      try {
        const { user } = validateAuth();
        
        console.log("👤 [useInviteAcceptance] Authenticated user for invite acceptance:", { userId: user.id });
        
        // Validate invitation status
        console.log("🔄 [useInviteAcceptance] Validating invitation status:", { inviteId });
        await validateInviteStatus(inviteId);
        console.log("✅ [useInviteAcceptance] Invitation status validated successfully");
        
        
        // Use a POST request with the function name as the path instead of rpc
        console.log("🔄 [useInviteAcceptance] Setting pair context:", { pairId: inviteData.pair_id });
        const { error: contextError } = await supabase
          .from('pairs')
          .update({ id: inviteData.pair_id })
          .eq('id', inviteData.pair_id)
          .select()
          .limit(1);
          
        if (contextError) {
          console.error("❌ [useInviteAcceptance] Failed to set pair context:", contextError);
        } else {
          console.log("✅ [useInviteAcceptance] Pair context set through alternative method");
        }
        
        // Check if user is already in a pair
        console.log("🔄 [useInviteAcceptance] Checking if user is already in a pair:", { userId: user.id });
        await checkForExistingPair(user.id, inviteData.pair_id);
        console.log("✅ [useInviteAcceptance] User pair check completed");
        
        // Update pair with the user
        console.log("🔄 [useInviteAcceptance] Updating pair:", { pairId: inviteData.pair_id, userId: user.id });
        await updatePair(inviteData.pair_id, user.id);
        console.log("✅ [useInviteAcceptance] Pair update requested");
        
        // Mark invitation as accepted
        console.log("🔄 [useInviteAcceptance] Marking invitation as accepted:", { inviteId });
        await markInviteAsAccepted(inviteId);
        console.log("✅ [useInviteAcceptance] Invitation marked as accepted");
        
        // Double check that the user is now in a pair
        console.log("🔄 [useInviteAcceptance] Verifying user pair status after update:", { userId: user.id });
        const pairCheck = await checkUserPair(user.id);
        console.log("✅ [useInviteAcceptance] Final pair verification result:", pairCheck);
        
        if (!pairCheck.data) {
          console.warn("⚠️ [useInviteAcceptance] User pair data not found after update, forcing refresh");
          
          // Try to explicitly refresh the view or cache using the edge function
          try {
            console.log("🔄 [useInviteAcceptance] Calling refresh-pair-details edge function:", { pairId: inviteData.pair_id, userId: user.id });
            const { error } = await supabase.functions.invoke('refresh-pair-details', {
              body: { pairId: inviteData.pair_id, userId: user.id }
            });
            if (error) {
              console.error("❌ [useInviteAcceptance] Error refreshing pair details:", error);
            } else {
              console.log("✅ [useInviteAcceptance] Edge function refresh completed");
            }
          } catch (refreshError) {
            console.error("❌ [useInviteAcceptance] Error calling refresh function:", refreshError);
          }
        }
        
        // Handle success and navigation
        console.log("🎉 [useInviteAcceptance] Invite acceptance completed successfully");
        handleSuccess(inviteData.sender_name);
        
        return 'accepted';
        
      } catch (authError: any) {
        console.error("❌ [useInviteAcceptance] Authentication error:", authError);
        toast({
          title: "Authentication Required",
          description: authError.message,
          variant: "destructive",
        });
        throw authError;
      }
      
    } catch (error: any) {
      console.error("❌ [useInviteAcceptance] Error accepting invitation:", error);
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
