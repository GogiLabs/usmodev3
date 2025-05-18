
import { supabase } from "@/integrations/supabase/client";

export async function updatePair(pairId: string, userId: string) {
  console.log("🔄 [updatePair] Updating pair with user:", { pairId, userId });
  
  try {
    // First, verify the pair exists
    console.log("🔍 [updatePair] Verifying pair exists:", { pairId });
    const { data: pairCheck, error: checkError } = await supabase
      .from('pairs')
      .select('id, user_1_id, user_2_id')
      .eq('id', pairId)
      .maybeSingle();
      
    console.log("🧪 [updatePair] Pair pre-update check:", { pairCheck, checkError });
    
    if (checkError) {
      console.error("❌ [updatePair] Error checking pair:", checkError);
      throw new Error(checkError.message || "Failed to verify pair");
    }
    
    if (!pairCheck) {
      console.error("❌ [updatePair] Pair not found:", pairId);
      throw new Error(`Pair with ID ${pairId} not found`);
    }

    console.log("🔍 [updatePair] Current pair state:", {
      user_1_id: pairCheck.user_1_id,
      user_2_id: pairCheck.user_2_id
    });
    
    // Perform the update
    console.log("🔄 [updatePair] Executing update SQL:", { pairId, userId });
    const { data: updateData, error: updateError } = await supabase
      .from('pairs')
      .update({ user_2_id: userId })
      .eq('id', pairId)
      .select();
    
    console.log("✏️ [updatePair] Pair update SQL result:", { updateData, updateError });
    
    if (updateError) {
      console.error("❌ [updatePair] Update error:", updateError);
      throw new Error(updateError.message || "Failed to update pair");
    }
    
    // Force refresh the pair details using the edge function
    try {
      console.log("🔄 [updatePair] Calling edge function to refresh pair details:", { pairId, userId });
      const { data, error } = await supabase.functions.invoke('refresh-pair-details', {
        body: { pairId, userId }
      });
      
      if (error) {
        console.warn("⚠️ [updatePair] Edge function error:", error);
      } else {
        console.log("✅ [updatePair] Edge function refresh response:", data);
      }
    } catch (refreshError) {
      console.warn("⚠️ [updatePair] Failed to call refresh edge function:", refreshError);
    }
    
    return true;
  } catch (error) {
    console.error("❌ [updatePair] Error updating pair:", error);
    throw error;
  }
}

export async function markInviteAsAccepted(inviteId: string) {
  console.log("🔄 [markInviteAsAccepted] Marking invitation as accepted:", { inviteId });
  
  try {
    // First, get the current invitation
    console.log("🔍 [markInviteAsAccepted] Fetching invitation details:", { inviteId });
    const { data: inviteCheck, error: checkError } = await supabase
      .from('invites')
      .select('id, status, pair_id')
      .eq('id', inviteId)
      .maybeSingle();
      
    console.log("🧪 [markInviteAsAccepted] Invite pre-update check:", { inviteCheck, checkError });
    
    if (checkError) {
      console.error("❌ [markInviteAsAccepted] Error checking invite:", checkError);
      throw new Error(checkError.message || "Failed to verify invitation");
    }
    
    // Update the invitation
    console.log("🔄 [markInviteAsAccepted] Executing update SQL for invitation status");
    const { data: updateData, error: inviteError } = await supabase
      .from('invites')
      .update({ status: 'accepted' })
      .eq('id', inviteId)
      .select();
  
    console.log("✏️ [markInviteAsAccepted] Invite update SQL result:", { updateData, inviteError });
    
    if (inviteError) {
      console.error("❌ [markInviteAsAccepted] Update error:", inviteError);
      throw new Error(inviteError.message || "Failed to update invitation status");
    }
    
    // Verify the update was successful
    console.log("🔍 [markInviteAsAccepted] Verifying invitation status update");
    const { data: verifyData, error: verifyError } = await supabase
      .from('invites')
      .select('status')
      .eq('id', inviteId)
      .single();
      
    console.log("✅ [markInviteAsAccepted] Post-update verification:", { 
      status: verifyData?.status, 
      verifyError 
    });
    
    return true;
  } catch (error) {
    console.error("❌ [markInviteAsAccepted] Error marking invite as accepted:", error);
    throw error;
  }
}

// Function to check if a user is paired by querying the pairs table directly
export async function checkUserPair(userId: string) {
  console.log("🔍 [checkUserPair] Checking pair status for user:", userId);
  
  const { data, error } = await supabase
    .from('pairs')
    .select('*')
    .or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`)
    .limit(1)
    .maybeSingle();
    
  console.log("🔍 [checkUserPair] Direct pair check result:", { 
    pairFound: !!data, 
    data, 
    error 
  });
  
  return { data, error };
}
