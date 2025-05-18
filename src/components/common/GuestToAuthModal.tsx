
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePairDetails } from "@/hooks/use-supabase-data";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ArrowRight, Save, UserPlus } from "lucide-react";
import { InviteHandler } from "@/components/common/InviteHandler";
import { useSearchParams, useLocation } from "react-router-dom";

// This component handles the transition from guest mode to authenticated mode
export function GuestToAuthModal() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { data: pairDetails, isLoading } = usePairDetails();
  const [previousAuthState, setPreviousAuthState] = useState(false);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const inviteId = searchParams.get("invite_id") || searchParams.get("inviteId");
  const pendingInviteId = localStorage.getItem("pending_invite_id");
  
  // Check if user has a pending invitation (either from URL or localStorage)
  const hasPendingInvitation = !!inviteId || !!pendingInviteId;
  
  // Check if user has just logged in
  useEffect(() => {
    if (isAuthenticated && !previousAuthState) {
      // Don't show the modal if the user has a pending invitation to accept
      if (!hasPendingInvitation) {
        setOpen(true);
      } else {
        console.log("Skipping welcome modal because user has a pending invitation");
      }
    }
    setPreviousAuthState(isAuthenticated);
  }, [isAuthenticated, previousAuthState, hasPendingInvitation]);
  
  // Determine if user is paired
  const isPaired = pairDetails?.user_1_id && pairDetails?.user_2_id;

  // Determing if user has pending invite
  const hasPendingInvite = !!pairDetails?.user_1_id && !pairDetails?.user_2_id;
  
  // If user is not authenticated or is paired or has a pending invite or came from an invitation link, don't show the modal
  if (!isAuthenticated || isPaired || hasPendingInvite || !open || hasPendingInvitation) {
    return null;
  }
  
  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Checking your account...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" text="Checking pair status..." />
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to UsMode!</DialogTitle>
          <DialogDescription>
            You've successfully signed in. Now let's set up your account.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col space-y-4 py-6">
          <div className="flex items-start space-x-4">
            <div className="bg-green-50 p-3 rounded-full">
              <Save className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-medium">Your local data is safe</h3>
              <p className="text-sm text-muted-foreground">
                Any tasks or rewards you created while signed out are saved locally on this device.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="bg-purple-50 p-3 rounded-full">
              <UserPlus className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h3 className="font-medium">Connect with your partner</h3>
              <p className="text-sm text-muted-foreground mb-3">
                To sync tasks and rewards across devices, you need to connect with your partner.
              </p>
              <InviteHandler />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            I'll do this later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
