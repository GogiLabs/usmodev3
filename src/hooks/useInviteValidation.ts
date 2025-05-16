
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFetchInviteData } from "./useInviteData";
import { useInviteContext } from "./useInviteContext";

type InviteStatus = 'checking' | 'valid' | 'invalid' | 'accepted' | 'expired' | 'auth_required';

export const useInviteValidation = (inviteId: string | null) => {
  const [retryCount, setRetryCount] = useState(0);
  const [runOnce, setRunOnce] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { contextSetAttempts } = useInviteContext();
  
  // Determine the initial status based on authentication
  const initialStatus: InviteStatus = !inviteId ? 'invalid' : 
                                      !isAuthenticated ? 'auth_required' : 
                                      'checking';

  const { 
    status, 
    setStatus,
    inviteData, 
    loading, 
    error,
    fetchInviteData
  } = useFetchInviteData(inviteId, isAuthenticated);
  
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
    if (loading || runOnce) return;
    
    fetchInviteData();
    setRunOnce(true);
    
  }, [inviteId, isAuthenticated, retryCount, loading, runOnce, fetchInviteData]);

  return { 
    loading, 
    status: initialStatus || status, 
    inviteData, 
    error, 
    refetch,
    contextSetAttempts,
    requiresAuth: status === 'auth_required'
  };
};
