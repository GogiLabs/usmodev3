
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export async function validateInviteStatus(inviteId: string) {
  console.log("🔍 Checking invitation status before accepting:", { inviteId });
  const { data: invite, error: checkError } = await supabase
    .from('invites')
    .select('status, expires_at')
    .eq('id', inviteId)
    .maybeSingle();
  
  console.log("📋 Invite validation result:", { invite, checkError });
  
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
  
  return invite;
}

export async function checkForExistingPair(userId: string, pairId?: string) {
  console.log("🔍 Checking if user is already in a pair:", { userId });
  const { data: existingPair, error: pairError } = await supabase
    .from('pairs')
    .select('id')
    .or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`)
    .maybeSingle();
  
  console.log("👥 Existing pair check result:", { existingPair, pairError });
  
  if (pairError && pairError.code !== 'PGRST116') {
    // PGRST116 means "no rows returned" which is actually what we want
    throw new Error(pairError.message || "Failed to check existing pairs");
  }
  
  if (existingPair && pairId && existingPair.id !== pairId) {
    throw new Error("You are already paired with someone else.");
  }
  
  return existingPair;
}

export function useAuthValidation() {
  const { user, isAuthenticated } = useAuth();
  
  return {
    validateAuth: () => {
      if (!isAuthenticated || !user) {
        throw new Error("You must be logged in to accept this invitation.");
      }
      return { user, isAuthenticated };
    }
  };
}
