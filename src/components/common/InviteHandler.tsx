
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Send, AlertCircle, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface InviteHandlerProps {
  compact?: boolean;
}

export function InviteHandler({ compact = false }: InviteHandlerProps) {
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

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
      const { error: newInviteError } = await supabase
        .from("invites")
        .insert({
          pair_id: pair.id,
          sender_id: user?.id,
          recipient_email: email,
          sender_email: user?.email || "invitation@us-mode.link",
          site_url: window.location.origin
        });

      if (newInviteError) throw new Error(newInviteError.message);

      toast({
        title: "Invite sent!",
        description: `An invitation has been sent to ${email}`,
      });
      
      setEmail("");
      setOpen(false);
    } catch (error: any) {
      console.error("Error sending invite:", error);
      toast({
        title: "Failed to send invite",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {compact ? (
          <Button variant="outline" size="sm" className="h-8 px-3">
            <Mail className="h-4 w-4 mr-1" />
            <span className="text-xs">Invite</span>
          </Button>
        ) : (
          <Button variant="secondary" className="text-accent w-full sm:w-auto">
            <Send className="h-4 w-4 mr-2" />
            Invite Partner
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Your Partner</DialogTitle>
          <DialogDescription>
            Enter your partner's email address to send them an invitation.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="partner@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) {
                  e.preventDefault();
                  handleInvite();
                }
              }}
            />
            <Button onClick={handleInvite} disabled={loading}>
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Sending...
                </>
              ) : "Send"}
            </Button>
          </div>
          <div className="flex items-start text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 mr-2 mt-0.5 text-amber-500" />
            <span>
              They'll receive an email with a link to join you.
              Invites expire after 7 days.
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
