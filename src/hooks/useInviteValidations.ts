
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export async function validateInviteStatus(inviteId: string) {
  console.log("🔍 [validateInviteStatus] Checking invitation status before accepting:", { inviteId });
  const { data: invite, error: checkError } = await supabase
    .from('invites')
    .select('status, expires_at')
    .eq('id', inviteId)
    .maybeSingle();
  
  console.log("📋 [validateInviteStatus] Invite validation result:", { 
    invite, 
    status: invite?.status,
    expires_at: invite?.expires_at,
    checkError 
  });
  
  if (checkError) {
    console.error("❌ [validateInviteStatus] Error verifying invite:", checkError);
    throw new Error(checkError.message || "Failed to verify invitation status");
  }
  
  if (!invite) {
    console.error("❌ [validateInviteStatus] Invitation not found:", { inviteId });
    throw new Error("Invitation not found");
  }
  
  if (invite.status === 'expired' || new Date(invite.expires_at) < new Date()) {
    console.error("❌ [validateInviteStatus] Invitation expired:", { 
      status: invite.status, 
      expires_at: invite.expires_at,
      currentTime: new Date().toISOString()
    });
    throw new Error("This invitation has expired");
  }
  
  if (invite.status === 'accepted') {
    console.error("❌ [validateInviteStatus] Invitation already accepted");
    throw new Error("This invitation has already been accepted");
  }
  
  console.log("✅ [validateInviteStatus] Invitation is valid");
  return invite;
}

export async function checkForExistingPair(userId: string, pairId?: string) {
  console.log("🔍 [checkForExistingPair] Checking if user is already in a pair:", { userId, targetPairId: pairId });
  const { data: existingPair, error: pairError } = await supabase
    .from('pairs')
    .select('id')
    .or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`)
    .maybeSingle();
  
  console.log("👥 [checkForExistingPair] Existing pair check result:", { 
    existingPair, 
    pairError,
    hasExistingPair: !!existingPair
  });
  
  if (pairError && pairError.code !== 'PGRST116') {
    // PGRST116 means "no rows returned" which is actually what we want
    console.error("❌ [checkForExistingPair] Error checking existing pairs:", pairError);
    throw new Error(pairError.message || "Failed to check existing pairs");
  }
  
  if (existingPair && pairId && existingPair.id !== pairId) {
    console.error("❌ [checkForExistingPair] User already paired with someone else:", {
      existingPairId: existingPair.id,
      targetPairId: pairId
    });
    throw new Error("You are already paired with someone else.");
  }
  
  console.log("✅ [checkForExistingPair] User pair check passed");
  return existingPair;
}

export function useAuthValidation() {
  const { user, isAuthenticated } = useAuth();
  
  return {
    validateAuth: () => {
      console.log("🔍 [useAuthValidation] Validating auth state:", { isAuthenticated, userId: user?.id });
      
      if (!isAuthenticated || !user) {
        console.error("❌ [useAuthValidation] User not authenticated");
        throw new Error("You must be logged in to accept this invitation.");
      }
      
      console.log("✅ [useAuthValidation] Auth validation passed for user:", user.id);
      return { user, isAuthenticated };
    }
  };
}
