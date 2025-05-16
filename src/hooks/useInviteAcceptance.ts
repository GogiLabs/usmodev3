
import { useInviteAcceptanceState } from "./useInviteAcceptanceState";
import { validateInviteStatus, checkForExistingPair, useAuthValidation } from "./useInviteValidations";
import { updatePair, markInviteAsAccepted } from "./useInvitePairUpdates";

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
        
        // Validate invitation status
        await validateInviteStatus(inviteId);
        
        // Check if user is already in a pair
        await checkForExistingPair(user.id, inviteData.pair_id);
        
        // Update pair with the user
        await updatePair(inviteData.pair_id, user.id);
        
        // Mark invitation as accepted
        await markInviteAsAccepted(inviteId);
        
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
