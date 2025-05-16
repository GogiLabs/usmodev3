
import { supabase } from "@/integrations/supabase/client";

export async function updatePair(pairId: string, userId: string) {
  console.log("🔄 Updating pair with user:", { pairId, userId });
  
  try {
    // First, verify the pair exists
    const { data: pairCheck, error: checkError } = await supabase
      .from('pairs')
      .select('id, user_1_id, user_2_id')
      .eq('id', pairId)
      .maybeSingle();
      
    console.log("🧪 Pair pre-update check:", { pairCheck, checkError });
    
    if (checkError) {
      console.error("❌ Error checking pair:", checkError);
      throw new Error(checkError.message || "Failed to verify pair");
    }
    
    if (!pairCheck) {
      console.error("❌ Pair not found:", pairId);
      throw new Error(`Pair with ID ${pairId} not found`);
    }
    
    // Perform the update
    const { data: updateData, error: updateError } = await supabase
      .from('pairs')
      .update({ user_2_id: userId })
      .eq('id', pairId)
      .select();
    
    console.log("✏️ Pair update SQL result:", { updateData, updateError });
    
    if (updateError) {
      throw new Error(updateError.message || "Failed to update pair");
    }
    
    // Force refresh the pairs and pair_details
    await supabase.rpc('refresh_pair_details');
    
    return true;
  } catch (error) {
    console.error("❌ Error updating pair:", error);
    throw error;
  }
}

export async function markInviteAsAccepted(inviteId: string) {
  console.log("🔄 Marking invitation as accepted:", { inviteId });
  
  try {
    // First, get the current invitation
    const { data: inviteCheck, error: checkError } = await supabase
      .from('invites')
      .select('id, status, pair_id')
      .eq('id', inviteId)
      .maybeSingle();
      
    console.log("🧪 Invite pre-update check:", { inviteCheck, checkError });
    
    if (checkError) {
      console.error("❌ Error checking invite:", checkError);
      throw new Error(checkError.message || "Failed to verify invitation");
    }
    
    // Update the invitation
    const { data: updateData, error: inviteError } = await supabase
      .from('invites')
      .update({ status: 'accepted' })
      .eq('id', inviteId)
      .select();
  
    console.log("✏️ Invite update SQL result:", { updateData, inviteError });
    
    if (inviteError) {
      throw new Error(inviteError.message || "Failed to update invitation status");
    }
    
    return true;
  } catch (error) {
    console.error("❌ Error marking invite as accepted:", error);
    throw error;
  }
}

// Function to check if a user is paired by querying the pairs table directly
export async function checkUserPair(userId: string) {
  console.log("🔍 Checking pair status for user:", userId);
  
  const { data, error } = await supabase
    .from('pairs')
    .select('*')
    .or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`)
    .limit(1)
    .maybeSingle();
    
  console.log("🔍 Direct pair check result:", { data, error });
  
  return { data, error };
}
