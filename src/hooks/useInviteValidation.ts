
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFetchInviteData } from "./useInviteData";
import { useInviteContext } from "./useInviteContext";
import { InviteStatus } from "@/components/invite/InviteStatus";

export const useInviteValidation = (inviteId: string | null) => {
  const [retryCount, setRetryCount] = useState(0);
  const [runOnce, setRunOnce] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { contextSetAttempts } = useInviteContext();
  
  // Determine the initial status based on authentication
  const initialStatus: InviteStatus = !inviteId ? 'invalid' : 
                                      !isAuthenticated ? 'auth_required' : 
                                      'checking';

  // Log user auth state
  console.log("🔑 useInviteValidation: Auth state:", { isAuthenticated, userId: user?.id });

  const { 
    status, 
    inviteData, 
    loading, 
    error,
    fetchInviteData
  } = useFetchInviteData(inviteId, isAuthenticated);
  
  // Log the current status
  console.log(`🏷️ Invite validation status: ${status}, loading: ${loading}, hasData: ${!!inviteData}`);
  
  // Function to retry validation
  const refetch = useCallback(() => {
    console.log("🔄 Retrying invitation validation...");
    setRetryCount(prev => prev + 1);
    setRunOnce(false);
  }, []);
  
  useEffect(() => {
    // If no invite ID is provided, mark as invalid immediately
    if (!inviteId) {
      console.log("❌ No invite ID provided");
      return;
    }
    
    // If not authenticated, mark that authentication is required
    if (!isAuthenticated) {
      console.log("🔒 Authentication required to validate invite");
      return;
    }
    
    // Prevent multiple simultaneous checks
    if (loading) {
      console.log("⏳ Skipping fetch as we're already loading");
      return;
    }
    
    if (runOnce) {
      console.log("🔁 Skipping duplicate fetch (runOnce=true)");
      return;
    }
    
    console.log("🚀 Initiating invite data fetch, attempt:", retryCount + 1);
    fetchInviteData();
    setRunOnce(true);
    
  }, [inviteId, isAuthenticated, retryCount, loading, runOnce, fetchInviteData]);

  // Final status to return - use the fetched status if available, otherwise use initial status
  const finalStatus = loading ? 'checking' : status || initialStatus;
  
  console.log(`📊 useInviteValidation final output: status=${finalStatus}, loading=${loading}`);

  return { 
    loading, 
    status: finalStatus, 
    inviteData, 
    error, 
    refetch,
    contextSetAttempts,
    requiresAuth: finalStatus === 'auth_required'
  };
};
