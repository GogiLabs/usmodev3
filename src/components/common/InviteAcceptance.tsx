
import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { InviteStatusDisplay } from "@/components/invite/InviteStatus";
import { useInviteValidation } from "@/hooks/useInviteValidation";
import { useInviteAcceptance } from "@/hooks/useInviteAcceptance";

export function InviteAcceptance() {
  const [searchParams] = useSearchParams();
  const inviteId = searchParams.get("invite_id");
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // Use the invite validation hook
  const { status, inviteData, loading } = useInviteValidation(inviteId);
  
  // Use the invite acceptance hook
  const { acceptInvite, loading: acceptLoading } = useInviteAcceptance(inviteId, inviteData);
  
  // If no invite ID is provided
  if (!inviteId) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Invalid Invitation</CardTitle>
          <CardDescription>No invitation ID was provided.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => navigate('/')} variant="outline" className="w-full">
            Return Home
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // UI for different states
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          {status === 'checking' && "Checking Invitation"}
          {status === 'valid' && "Join Your Partner"}
          {status === 'invalid' && "Invalid Invitation"}
          {status === 'expired' && "Expired Invitation"}
          {status === 'accepted' && "Invitation Accepted"}
        </CardTitle>
        <CardDescription>
          {status === 'checking' && "Please wait while we verify your invitation..."}
          {status === 'valid' && inviteData?.sender_name && `${inviteData.sender_name} has invited you to collaborate`}
          {status === 'invalid' && "This invitation link is invalid or cannot be found"}
          {status === 'expired' && "This invitation has expired"}
          {status === 'accepted' && "You've successfully connected with your partner!"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="text-center">
        <InviteStatusDisplay status={status} senderName={inviteData?.sender_name} />
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-2">
        {status === 'valid' && (
          <>
            {!isAuthenticated ? (
              <>
                <Button 
                  onClick={() => navigate(`/auth?invite_id=${inviteId}`)} 
                  className="w-full"
                >
                  Sign in to accept
                </Button>
                <p className="text-sm text-muted-foreground">
                  You'll need to sign in or create an account to accept this invitation.
                </p>
              </>
            ) : (
              <Button 
                onClick={acceptInvite} 
                className="w-full" 
                disabled={loading || acceptLoading}
              >
                {loading || acceptLoading ? "Processing..." : "Accept Invitation"}
              </Button>
            )}
          </>
        )}
        
        {(status === 'invalid' || status === 'expired') && (
          <Button onClick={() => navigate('/')} variant="outline" className="w-full">
            Return Home
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
