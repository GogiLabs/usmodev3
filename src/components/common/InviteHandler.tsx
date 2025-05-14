
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Send, Mail } from "lucide-react";
import { useInviteSender } from "@/hooks/useInviteSender";
import { InviteDialogContent } from "@/components/invite/InviteDialogContent";

interface InviteHandlerProps {
  compact?: boolean;
}

export function InviteHandler({ compact = false }: InviteHandlerProps) {
  const [open, setOpen] = useState(false);
  const { email, setEmail, loading, handleInvite } = useInviteSender();

  const handleSuccess = () => {
    setOpen(false);
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
      <InviteDialogContent
        email={email}
        setEmail={setEmail}
        loading={loading}
        handleInvite={handleInvite}
        onSuccess={handleSuccess}
      />
    </Dialog>
  );
}
