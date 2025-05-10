
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
    const checkInvite = async () => {
      if (!inviteId) {
        setStatus('invalid');
        return;
      }

      try {
        setLoading(true);
        
        // Get invite details
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
          .single();
          
        if (inviteError || !invite) {
          console.error("Error fetching invite:", inviteError);
          setStatus('invalid');
          return;
        }
        
        // Check if invite is expired
        if (invite.status === 'expired' || new Date(invite.expires_at) < new Date()) {
          setStatus('expired');
          return;
        }
        
        // Check if invite is already accepted
        if (invite.status === 'accepted') {
          setStatus('accepted');
          return;
        }
        
        // Invite is valid
        setStatus('valid');
        
        // Get the sender's profile data
        try {
          // Get the sender's profile data
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')  // Select all columns to ensure we get what's available
            .eq('id', invite.sender_id)
            .single();
          
          if (profileError) {
            console.error("Error fetching sender profile:", profileError);
            // Set default values if profile fetch fails
            setInviteData({
              sender_name: 'your partner',
              pair_id: invite.pair_id
            });
            return;
          }
          
          // Now use optional chaining and defaults for safety
          const displayName = profileData?.display_name;
          // Attempt to get email from the profile or use null
          const email = null; // Since email doesn't exist in profiles table based on the error
          
          const senderName = displayName || (email ? email.split('@')[0] : 'Someone');
          
          setInviteData({
            sender_email: email,
            sender_name: senderName,
            pair_id: invite.pair_id
          });
        } catch (error) {
          console.error("Error in profile processing:", error);
          // Fallback data
          setInviteData({
            pair_id: invite.pair_id,
            sender_name: 'your partner'
          });
        }
        
      } catch (error) {
        console.error("Error checking invite:", error);
        setStatus('invalid');
      } finally {
        setLoading(false);
      }
    };

    checkInvite();
  }, [inviteId]);

  return { loading, status, inviteData };
};
