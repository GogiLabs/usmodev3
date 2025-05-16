
import { supabase } from "@/integrations/supabase/client";

export async function updatePair(pairId: string, userId: string) {
  console.log("🔄 Updating pair with user:", { pairId, userId });
  const { error: updateError } = await supabase
    .from('pairs')
    .update({ user_2_id: userId })
    .eq('id', pairId);
  
  console.log("✏️ Pair update result:", { updateError });
  
  if (updateError) {
    throw new Error(updateError.message || "Failed to update pair");
  }
  
  return true;
}

export async function markInviteAsAccepted(inviteId: string) {
  console.log("🔄 Marking invitation as accepted:", { inviteId });
  const { error: inviteError } = await supabase
    .from('invites')
    .update({ status: 'accepted' })
    .eq('id', inviteId);
  
  console.log("✏️ Invite update result:", { inviteError });
  
  if (inviteError) {
    throw new Error(inviteError.message || "Failed to update invitation status");
  }
  
  return true;
}
