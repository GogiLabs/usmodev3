
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { toast as sonnerToast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseError } from "@/hooks/use-supabase-error";

export function useInviteSender() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { handleError } = useSupabaseError();

  const sendInviteEmail = async (inviteId: string, recipientEmail: string) => {
    try {
      const { data: senderInfo } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user?.id)
        .single();
      
      const senderName = senderInfo?.display_name || user?.email?.split('@')[0] || 'Your partner';
      const senderEmail = user?.email || 'invitation@us-mode.link';
      
      const response = await supabase.functions.invoke('send-invite-email', {
        body: {
          inviteId,
          recipientEmail,
          senderEmail,
          senderName,
          siteUrl: window.location.origin
        }
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to send invitation email");
      }

      console.log("Email sending response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Error sending invitation email:", error);
      throw error;
    }
  };

  const handleInvite = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your partner's email address.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // First check if a pair already exists
      const { data: existingPair, error: pairError } = await supabase
        .from("pairs")
        .select("id")
        .or(`user_1_id.eq.${user?.id},user_2_id.eq.${user?.id}`)
        .maybeSingle();

      if (pairError) {
        throw new Error(pairError.message);
      }

      if (existingPair) {
        toast({
          title: "Pair already exists",
          description: "You are already paired with someone.",
          variant: "destructive",
        });
        return;
      }

      // Then check for existing invites
      const { data: existingInvite, error: inviteError } = await supabase
        .from("invites")
        .select("id")
        .eq("sender_id", user?.id)
        .eq("recipient_email", email)
        .eq("status", "pending")
        .maybeSingle();

      if (inviteError) {
        throw new Error(inviteError.message);
      }

      if (existingInvite) {
        toast({
          title: "Invite already sent",
          description: `An invite has already been sent to ${email}`,
          variant: "destructive",
        });
        return;
      }

      // Check the rate limit using the fixed function
      const { data: withinRateLimit, error: rateLimitError } = await supabase.rpc(
        "check_invite_rate_limit", 
        { sender_id: user?.id }
      );
      
      if (rateLimitError) {
        throw new Error(rateLimitError.message);
      }
      
      if (!withinRateLimit) {
        toast({
          title: "Rate limit exceeded",
          description: "You can only send 5 invites within a 24-hour period.",
          variant: "destructive",
        });
        return;
      }
      
      // Create a new pair with only the current user
      const { data: pair, error: newPairError } = await supabase
        .from("pairs")
        .insert({ user_1_id: user?.id })
        .select()
        .single();

      if (newPairError) throw new Error(newPairError.message);

      // Send the invite
      const { data: invite, error: newInviteError } = await supabase
        .from("invites")
        .insert({
          pair_id: pair.id,
          sender_id: user?.id,
          recipient_email: email,
          sender_email: user?.email || "invitation@us-mode.link",
          site_url: window.location.origin
        })
        .select()
        .single();

      if (newInviteError) throw new Error(newInviteError.message);

      // Send the actual email using our new edge function
      await sendInviteEmail(invite.id, email);

      // Show success messages
      toast({
        title: "Invite sent!",
        description: `An invitation has been sent to ${email}`,
      });
      
      sonnerToast.success("Invite sent!", {
        description: `${email} will receive an email with instructions to join.`
      });
      
      setEmail("");
      return true;
    } catch (error: any) {
      handleError(error, {
        errorPrefix: "Failed to send invite",
        showToasts: true,
        showSonner: false
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { 
    email, 
    setEmail, 
    loading, 
    handleInvite 
  };
}
