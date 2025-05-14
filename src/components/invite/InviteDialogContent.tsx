
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { AlertCircle } from "lucide-react";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface InviteDialogContentProps {
  email: string;
  setEmail: (email: string) => void;
  loading: boolean;
  handleInvite: () => Promise<boolean>;
  onSuccess?: () => void;
}

export function InviteDialogContent({ 
  email, 
  setEmail, 
  loading, 
  handleInvite,
  onSuccess 
}: InviteDialogContentProps) {
  const handleSubmit = async () => {
    const success = await handleInvite();
    if (success && onSuccess) {
      onSuccess();
    }
  };

  return (
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
                handleSubmit();
              }
            }}
          />
          <Button onClick={handleSubmit} disabled={loading}>
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
  );
}
