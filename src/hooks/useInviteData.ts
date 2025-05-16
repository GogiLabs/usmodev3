
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useInviteContext } from "./useInviteContext";
import { InviteStatus } from "@/components/invite/InviteStatus";

type InviteData = {
  sender_email?: string;
  sender_name?: string;
  pair_id?: string;
} | null;

export function useFetchInviteData(inviteId: string | null, isAuthenticated: boolean) {
  const [status, setStatus] = useState<InviteStatus>('checking');
  const [inviteData, setInviteData] = useState<InviteData>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { setInviteContext } = useInviteContext();
  
  const fetchInviteData = async () => {
    if (!inviteId || !isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Set invite context first
      const contextSet = await setInviteContext(inviteId);
      if (!contextSet) {
        throw new Error("Unable to access invitation details");
      }
      
      // Now fetch the invitation data
      console.log("🔍 Fetching invite for ID:", inviteId);
      const { data: invite, error: inviteError } = await supabase
        .from('invites')
        .select(`
          id, 
          status, 
          pair_id, 
          expires_at, 
          sender_id,
          recipient_email
        `)
        .eq('id', inviteId)
        .maybeSingle();
        
      console.log("🧪 Raw invite data:", invite);
      
      if (inviteError) {
        throw new Error(inviteError.message || "Failed to fetch invitation details");
      }
      
      if (!invite) {
        console.log("❌ No invite found with ID:", inviteId);
        setStatus('invalid');
        setError(new Error("This invitation doesn't exist or has been deleted"));
        return;
      }
      
      console.log("📨 Invite query result:", { invite, inviteError });
      
      // Check if invite is expired
      if (invite.status === 'expired' || new Date(invite.expires_at) < new Date()) {
        console.log("⏰ Invite is expired:", { status: invite.status, expires_at: invite.expires_at });
        setStatus('expired');
        return;
      }
      
      // Check if invite is already accepted
      if (invite.status === 'accepted') {
        console.log("✅ Invite is already accepted");
        setStatus('accepted');
        return;
      }
      
      // Invite is valid
      console.log("✅ Invite is valid");
      setStatus('valid');
      
      try {
        // Get the sender's profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('id', invite.sender_id)
          .maybeSingle();
        
        console.log("👤 Sender profile data:", { profileData, profileError });
        
        // Set invite data with sender info
        const displayName = profileData?.display_name;
        
        setInviteData({
          sender_name: displayName || 'your partner',
          pair_id: invite.pair_id,
          sender_email: invite.recipient_email
        });
        
      } catch (profileError) {
        console.error("❌ Error fetching sender profile:", profileError);
        // Fallback data
        setInviteData({
          pair_id: invite.pair_id,
          sender_name: 'your partner'
        });
      }
      
    } catch (error: any) {
      console.error("❌ Error checking invite:", error);
      setStatus('invalid');
      setError(error instanceof Error ? error : new Error(error.message || "Failed to validate invitation"));
    } finally {
      setLoading(false);
    }
  };
  
  return {
    status,
    inviteData,
    loading,
    error,
    fetchInviteData
  };
}
