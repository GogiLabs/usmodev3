
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useSupabaseError } from "@/hooks/use-supabase-error";
import { useAuth } from "@/contexts/AuthContext";

type InviteStatus = 'checking' | 'valid' | 'invalid' | 'accepted' | 'expired' | 'auth_required';

type InviteData = {
  sender_email?: string;
  sender_name?: string;
  pair_id?: string;
} | null;

export const useInviteValidation = (inviteId: string | null) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<InviteStatus>('checking');
  const [inviteData, setInviteData] = useState<InviteData>(null);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();
  const { handleError } = useSupabaseError();
  const [runOnce, setRunOnce] = useState(false);
  const [contextSetAttempts, setContextSetAttempts] = useState(0);
  const { isAuthenticated } = useAuth();

  // Function to retry validation
  const refetch = useCallback(() => {
    console.log("🔄 Retrying invitation validation...");
    setRetryCount(prev => prev + 1);
    setError(null);
    setStatus('checking');
    setRunOnce(false);
    setContextSetAttempts(0);
  }, []);

  useEffect(() => {
    // If no invite ID is provided, mark as invalid immediately
    if (!inviteId) {
      console.log("❌ No invite ID provided");
      setStatus('invalid');
      return;
    }
    
    // If not authenticated, mark that authentication is required
    if (!isAuthenticated) {
      console.log("🔒 Authentication required to validate invite");
      setStatus('auth_required');
      return;
    }
    
    // Prevent multiple simultaneous checks
    if (loading || runOnce) return;
    
    const checkInvite = async () => {
      try {
        console.log(`🔍 Checking invite ID: ${inviteId}`);
        setLoading(true);
        setError(null);
        setRunOnce(true);

        // First, try to set the invite context with retries if needed
        let contextSuccess = false;
        let contextAttempt = 0;
        
        while (!contextSuccess && contextAttempt < 3) {
          try {
            contextAttempt++;
            setContextSetAttempts(prev => prev + 1);
            
            // Using the RPC function to bypass TypeScript error
            await supabase.rpc('set_invite_context' as any, { invite_id: inviteId });
            console.log("✅ Invite context set successfully");
            contextSuccess = true;
          } catch (contextError) {
            console.error(`❌ Error setting invite context (attempt ${contextAttempt}/3):`, contextError);
            if (contextAttempt >= 3) {
              console.error("⚠️ Failed to set invite context after 3 attempts");
            } else {
              // Wait briefly before retry
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        }
        
        // Get invite details - Using direct fetch with no RLS restrictions
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
          console.error("❌ Error fetching invite:", inviteError);
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
          
          // If it's expired but not marked as such in the database, update it
          if (invite.status !== 'expired') {
            try {
              await supabase
                .from('invites')
                .update({ status: 'expired' })
                .eq('id', inviteId);
              console.log("✅ Updated invite status to expired in database");
            } catch (updateError) {
              console.error("❌ Error updating invite status:", updateError);
              // Non-critical error, don't throw
            }
          }
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
          
          if (profileError || !profileData) {
            console.error("❌ Error fetching sender profile:", profileError);
            // Set default values if profile fetch fails
            setInviteData({
              sender_name: 'your partner',
              pair_id: invite.pair_id
            });
            return;
          }
          
          // Use optional chaining and defaults for safety
          const displayName = profileData?.display_name;
          
          setInviteData({
            sender_name: displayName || 'your partner',
            pair_id: invite.pair_id,
            sender_email: invite.recipient_email
          });
          
          console.log("📝 Set invite data:", { 
            sender_name: displayName || 'your partner', 
            pair_id: invite.pair_id,
            sender_email: invite.recipient_email
          });
        } catch (profileError) {
          console.error("❌ Error in profile processing:", profileError);
          // Fallback data
          setInviteData({
            pair_id: invite.pair_id,
            sender_name: 'your partner'
          });
        }
        
      } catch (error: any) {
        console.error("❌ Error checking invite:", error);
        setStatus('invalid');
        setError(error instanceof Error ? error : new Error("Failed to validate invitation"));
        
        handleError(error, {
          errorPrefix: "Error checking invitation",
          showToasts: true,
          showSonner: false
        });
      } finally {
        setLoading(false);
      }
    };

    checkInvite();
  }, [inviteId, retryCount, toast, handleError, loading, runOnce, isAuthenticated]);

  return { 
    loading, 
    status, 
    inviteData, 
    error, 
    refetch,
    contextSetAttempts,
    requiresAuth: status === 'auth_required'
  };
};
