
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { toast as sonnerToast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { InviteStatusDisplay } from "@/components/invite/InviteStatus";
import { useInviteValidation } from "@/hooks/useInviteValidation";
import { useInviteAcceptance } from "@/hooks/useInviteAcceptance";
import { NetworkErrorAlert } from "@/components/common/NetworkErrorAlert";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export function InviteAcceptance() {
  const [searchParams] = useSearchParams();
  const inviteId = searchParams.get("invite_id");
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [networkError, setNetworkError] = useState<Error | null>(null);
  const [acceptSuccess, setAcceptSuccess] = useState(false);
  
  // Use the invite validation hook
  const { status, inviteData, loading: validationLoading, error: validationError, refetch: refetchInvite } = useInviteValidation(inviteId);
  
  // Use the invite acceptance hook
  const { acceptInvite, loading: acceptLoading } = useInviteAcceptance(inviteId, inviteData);
  
  // Handle errors
  useEffect(() => {
    if (validationError) {
      setNetworkError(validationError);
    } else {
      setNetworkError(null);
    }
  }, [validationError]);
  
  // Handle automatic redirect after successful acceptance
  useEffect(() => {
    if (acceptSuccess) {
      // Show success toast
      sonnerToast.success("Connection established!", {
        description: "You've successfully paired with your partner.",
      });
      
      // Redirect after short delay to allow animation to play
      const timer = setTimeout(() => {
        navigate('/');
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, [acceptSuccess, navigate]);
  
  // Handle the invite acceptance
  const handleAcceptInvite = async () => {
    try {
      const result = await acceptInvite();
      if (result === 'accepted') {
        setAcceptSuccess(true);
      }
    } catch (error) {
      console.error("Error accepting invite:", error);
      toast({
        variant: "destructive",
        title: "Failed to accept invitation",
        description: "There was a problem connecting to your partner. Please try again."
      });
    }
  };
  
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

  // Show network error if any
  if (networkError && !validationLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Connection Error</CardTitle>
          <CardDescription>We had trouble retrieving the invitation details.</CardDescription>
        </CardHeader>
        <CardContent>
          <NetworkErrorAlert 
            message={networkError.message || "Failed to load invitation details. Please check your connection."} 
            onRetry={refetchInvite}
          />
        </CardContent>
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
          {status === 'accepted' || acceptSuccess ? "Invitation Accepted" : ""}
        </CardTitle>
        <CardDescription>
          {status === 'checking' && "Please wait while we verify your invitation..."}
          {status === 'valid' && inviteData?.sender_name && `${inviteData.sender_name} has invited you to collaborate`}
          {status === 'invalid' && "This invitation link is invalid or cannot be found"}
          {status === 'expired' && "This invitation has expired"}
          {(status === 'accepted' || acceptSuccess) && "You've successfully connected with your partner!"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="text-center">
        {validationLoading ? (
          <LoadingSpinner size="lg" text="Checking invitation status..." />
        ) : (
          <InviteStatusDisplay status={acceptSuccess ? 'accepted' : status} senderName={inviteData?.sender_name} />
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-2">
        {status === 'valid' && (
          <>
            {!isAuthenticated ? (
              <>
                <Button 
                  onClick={() => navigate(`/auth?invite_id=${inviteId}`)} 
                  className="w-full"
                  variant="default"
                >
                  Sign in to accept
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  You'll need to sign in or create an account to accept this invitation.
                </p>
              </>
            ) : (
              <Button 
                onClick={handleAcceptInvite} 
                className="w-full" 
                disabled={validationLoading || acceptLoading || acceptSuccess}
              >
                {acceptLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Processing...
                  </>
                ) : "Accept Invitation"}
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
