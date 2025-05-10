
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Send, AlertCircle } from "lucide-react";
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

export function InviteHandler() {
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
      const { data: existingPair } = await supabase
        .from("pairs")
        .select("id")
        .or(`user_1_id.eq.${user?.id},user_2_id.eq.${user?.id}`)
        .maybeSingle();

      if (existingPair) {
        toast({
          title: "Pair already exists",
          description: "You are already paired with someone.",
          variant: "destructive",
        });
        return;
      }

      // Then check for existing invites
      const { data: existingInvite } = await supabase
        .from("invites")
        .select("id")
        .eq("sender_id", user?.id)
        .eq("recipient_email", email)
        .eq("status", "pending")
        .maybeSingle();

      if (existingInvite) {
        toast({
          title: "Invite already sent",
          description: `An invite has already been sent to ${email}`,
          variant: "destructive",
        });
        return;
      }

      // Check the rate limit by calling the function
      const { data: withinRateLimit } = await supabase.rpc(
        "check_invite_rate_limit", 
        { sender_id: user?.id }
      );
      
      if (!withinRateLimit) {
        toast({
          title: "Rate limit exceeded",
          description: "You can only send 5 invites within a 24-hour period.",
          variant: "destructive",
        });
        return;
      }
      
      // Create a new pair with only the current user
      const { data: pair, error: pairError } = await supabase
        .from("pairs")
        .insert({ user_1_id: user?.id })
        .select()
        .single();

      if (pairError) throw pairError;

      // Send the invite
      const { error: inviteError } = await supabase
        .from("invites")
        .insert({
          pair_id: pair.id,
          sender_id: user?.id,
          recipient_email: email,
        });

      if (inviteError) throw inviteError;

      toast({
        title: "Invite sent!",
        description: `An invitation has been sent to ${email}`,
      });
      
      setEmail("");
      setOpen(false);
    } catch (error: any) {
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
        <Button variant="secondary" className="text-accent">
          <Send className="h-4 w-4 mr-2" />
          Invite Partner
        </Button>
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
            />
            <Button onClick={handleInvite} disabled={loading}>
              {loading ? "Sending..." : "Send"}
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
