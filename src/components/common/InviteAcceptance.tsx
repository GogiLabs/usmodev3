import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { toast as sonnerToast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { InviteStatusDisplay } from "@/components/invite/InviteStatus";
import { useInviteValidation } from "@/hooks/useInviteValidation";
import { useInviteAcceptance } from "@/hooks/useInviteAcceptance";
import { NetworkErrorAlert } from "@/components/common/NetworkErrorAlert";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { motion, AnimatePresence } from "framer-motion";

export function InviteAcceptance() {
  const [searchParams] = useSearchParams();
  const inviteId = searchParams.get("invite_id") || searchParams.get("inviteId");
  console.log("🔍 InviteAcceptance: inviteId =", inviteId);

  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [networkError, setNetworkError] = useState<Error | null>(null);
  const [acceptSuccess, setAcceptSuccess] = useState(false);

  const {
    status,
    inviteData,
    loading: validationLoading,
    error: validationError,
    refetch: refetchInvite
  } = useInviteValidation(inviteId);

useEffect(() => {
  console.log("📬 useInviteValidation result:", {
    inviteId,
    status,
    inviteData,
    isDataNull: inviteData == null,
    expiresAt: (inviteData as any)?.expires_at,
    currentTime: new Date().toISOString()
  });
}, [status, inviteData]);

  const {
    acceptInvite,
    loading: acceptLoading,
    error: acceptError,
    clearError
  } = useInviteAcceptance(inviteId, inviteData);

  useEffect(() => {
    if (validationError) {
      console.error("❌ Validation Error:", validationError);
    }
    if (acceptError) {
      console.error("❌ Acceptance Error:", acceptError);
    }
  }, [validationError, acceptError]);

  useEffect(() => {
    if (acceptSuccess) {
      sonnerToast.success("Connection established!", {
        description: "You've successfully paired with your partner.",
        duration: 5000,
      });

      const timer = setTimeout(() => {
        navigate("/");
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [acceptSuccess, navigate]);

  const handleAcceptInvite = async () => {
    try {
      clearError();
      const result = await acceptInvite();
      if (result === "accepted") {
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

  if (!inviteId) {
    console.warn("⚠️ No inviteId provided. Showing invalid card.");
    return (
      <Card className="w-full max-w-md mx-auto shadow-lg border-red-100">
        <CardHeader>
          <CardTitle className="text-red-500">Invalid Invitation</CardTitle>
          <CardDescription>No invitation ID was provided.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The invitation link you followed is incomplete or invalid. Please check your email for the correct invitation link.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => navigate("/")} variant="outline" className="w-full">
            Return Home
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (networkError && !validationLoading) {
    console.warn("⚠️ Network error detected. Showing error card.");
    return (
      <Card className="w-full max-w-md mx-auto shadow-lg border-red-100">
        <CardHeader>
          <CardTitle className="text-red-500">Connection Error</CardTitle>
          <CardDescription>We had trouble retrieving the invitation details.</CardDescription>
        </CardHeader>
        <CardContent>
          <NetworkErrorAlert 
            message={networkError.message || "Failed to load invitation details. Please check your connection."} 
            onRetry={refetchInvite}
          />
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button onClick={refetchInvite} className="w-full">
            Try Again
          </Button>
          <Button onClick={() => navigate("/")} variant="outline" className="w-full">
            Return Home
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-full max-w-md mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className={
              `${(status === 'expired' || status === 'invalid') ? 'text-amber-500' :
                status === 'accepted' || acceptSuccess ? 'text-green-500' : ''}`
            }>
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
              <InviteStatusDisplay status={acceptSuccess ? 'accepted' : status} senderName={inviteData?.sender_name} onRetry={refetchInvite} />
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-2">
            <AnimatePresence mode="wait">
              {status === 'valid' && (
                <motion.div
                  className="w-full"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {!isAuthenticated ? (
                    <>
                      <Button 
                        onClick={() => navigate(`/auth?invite_id=${inviteId}`)} 
                        className="w-full"
                        variant="default"
                      >
                        Sign in to accept
                      </Button>
                      <p className="text-sm text-muted-foreground text-center mt-2">\                        You'll need to sign in or create an account to accept this invitation.
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
                </motion.div>
              )}

              {(status === 'invalid' || status === 'expired') && (
                <motion.div
                  className="w-full space-y-3"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {status === 'expired' && (
                    <p className="text-sm text-muted-foreground mb-2">\                      Please ask your partner to send you a new invitation.
                    </p>
                  )}
                  <Button onClick={() => navigate("/")} variant="outline" className="w-full">
                    Return Home
                  </Button>
                </motion.div>
              )}

              {(status === 'accepted' || acceptSuccess) && (
                <motion.div
                  className="w-full"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <p className="text-sm text-muted-foreground mb-3 text-center">\                    Redirecting to your dashboard...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardFooter>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}