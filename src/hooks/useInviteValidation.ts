
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

type InviteStatus = 'checking' | 'valid' | 'invalid' | 'accepted' | 'expired';

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

  // Function to retry validation
  const refetch = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setError(null);
    setStatus('checking');
  }, []);

  useEffect(() => {
    const checkInvite = async () => {
      if (!inviteId) {
        setStatus('invalid');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        await supabase.rpc('set_invite_context', { invite_id: inviteId });
        // Get invite details - no longer filtering by recipient_email
        const { data: invite, error: inviteError } = await supabase
          .from('invites')
          .select(`
            id, 
            status, 
            pair_id, 
            expires_at, 
            sender_id
          `)
          .eq('id', inviteId)
          .maybeSingle();
          
        if (inviteError) {
          console.error("Error fetching invite:", inviteError);
          throw new Error(inviteError.message || "Failed to fetch invitation details");
        }
        
        if (!invite) {
          setStatus('invalid');
          return;
        }
        
        // Check if invite is expired
        if (invite.status === 'expired' || new Date(invite.expires_at) < new Date()) {
          setStatus('expired');
          
          // If it's expired but not marked as such in the database, update it
          if (invite.status !== 'expired') {
            try {
              await supabase
                .from('invites')
                .update({ status: 'expired' })
                .eq('id', inviteId);
            } catch (updateError) {
              console.error("Error updating invite status:", updateError);
              // Non-critical error, don't throw
            }
          }
          return;
        }
        
        // Check if invite is already accepted
        if (invite.status === 'accepted') {
          setStatus('accepted');
          return;
        }
        
        // Invite is valid
        setStatus('valid');
        
        try {
          // Get the sender's profile data
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', invite.sender_id)
            .maybeSingle();
          
          if (profileError) {
            console.error("Error fetching sender profile:", profileError);
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
            pair_id: invite.pair_id
          });
        } catch (profileError) {
          console.error("Error in profile processing:", profileError);
          // Fallback data
          setInviteData({
            pair_id: invite.pair_id,
            sender_name: 'your partner'
          });
        }
        
      } catch (error: any) {
        console.error("Error checking invite:", error);
        setStatus('invalid');
        setError(error instanceof Error ? error : new Error("Failed to validate invitation"));
        
        toast({
          title: "Error checking invitation",
          description: error.message || "There was a problem validating this invitation",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    checkInvite();
  }, [inviteId, retryCount, toast]);

  return { loading, status, inviteData, error, refetch };
};
