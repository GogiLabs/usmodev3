
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
        const { data: profileData } = await supabase
          .from('profiles')
          .select('email, display_name')
          .eq('id', invite.sender_id)
          .single();
            
        const senderEmail = profileData?.email;
        const senderName = profileData?.display_name || senderEmail?.split('@')[0] || 'Someone';
        
        setInviteData({
          sender_email: senderEmail,
          sender_name: senderName,
          pair_id: invite.pair_id
        });
        
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
