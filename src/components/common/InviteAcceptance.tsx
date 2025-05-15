
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
import { AlertCircle, RefreshCw } from "lucide-react";

export function InviteAcceptance() {
  const [searchParams] = useSearchParams();
  const inviteId = searchParams.get("invite_id") || searchParams.get("inviteId");
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [networkError, setNetworkError] = useState<Error | null>(null);
  const [acceptSuccess, setAcceptSuccess] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [validationAttempts, setValidationAttempts] = useState(0);

  useEffect(() => {
    console.log("🔍 InviteAcceptance: inviteId =", inviteId);
  }, [inviteId]);

  const {
    status,
    inviteData,
    loading: validationLoading,
    error: validationError,
    refetch: refetchInvite,
    contextSetAttempts
  } = useInviteValidation(inviteId);

  // Detect if we've been stuck in "checking" status for too long
  useEffect(() => {
    if (status === 'checking' && validationLoading) {
      const timer = setTimeout(() => {
        setValidationAttempts(prev => {
          // If we've already tried 3 times, force an invalid state
          if (prev >= 2) {
            console.log("⚠️ Invite validation timed out after multiple attempts");
            return prev;
          }
          // Otherwise, try refetching
          refetchInvite();
          return prev + 1;
        });
      }, 5000); // Wait 5 seconds before considering it stuck
      
      return () => clearTimeout(timer);
    }
  }, [status, validationLoading, refetchInvite]);

  useEffect(() => {
    const debugData = {
      inviteId,
      status,
      inviteData,
      isDataNull: inviteData == null,
      currentTime: new Date().toISOString(),
      user: user ? { id: user.id, email: user.email } : null,
      isAuthenticated,
      validationAttempts,
      contextSetAttempts
    };
    
    console.log("📬 useInviteValidation result:", debugData);
    setDebugInfo(debugData);
  }, [status, inviteData, inviteId, user, isAuthenticated, validationAttempts, contextSetAttempts]);

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

  // Improve error handling for cases where validation is stuck
  useEffect(() => {
    if (validationAttempts >= 3 && status === 'checking') {
      console.log("⚠️ Forcing invitation status update due to timeout");
      setNetworkError(new Error("Invitation validation timed out. Please try again."));
    }
  }, [validationAttempts, status]);

  if (!inviteId) {
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

  // If validation attempts exceed threshold and we're still checking, show timeout UI
  if (validationAttempts >= 3 && status === 'checking') {
    return (
      <Card className="w-full max-w-md mx-auto shadow-lg border-amber-100">
        <CardHeader>
          <CardTitle className="text-amber-500">Invitation Check Timed Out</CardTitle>
          <CardDescription>We're having trouble verifying this invitation.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-amber-50 rounded-md flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-amber-800">We couldn't verify this invitation after multiple attempts.</p>
              <p className="text-sm text-amber-700 mt-2">The invitation may have been deleted or expired, or there may be a connection issue.</p>
            </div>
          </div>
          
          {import.meta.env.DEV && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md">
              <details>
                <summary className="text-sm font-medium cursor-pointer">Debug Information</summary>
                <pre className="mt-2 text-xs overflow-auto max-h-40">
                  {JSON.stringify({ inviteId, attempts: validationAttempts, error: validationError?.message }, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button 
            onClick={refetchInvite} 
            className="w-full"
            variant="default"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Try Again
          </Button>
          <Button onClick={() => navigate("/")} variant="outline" className="w-full">
            Return Home
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (status === 'invalid' && validationError) {
    const errorMessage = validationError?.message || "This invitation doesn't exist or has been revoked.";
    
    return (
      <Card className="w-full max-w-md mx-auto shadow-lg border-red-100">
        <CardHeader>
          <CardTitle className="text-red-500">Invalid Invitation</CardTitle>
          <CardDescription>{errorMessage}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-left">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Possible reasons:</p>
                <ul className="text-xs text-amber-700 mt-1 list-disc pl-5">
                  <li>The invitation link may have been copied incorrectly</li>
                  <li>The invitation may have been deleted by the sender</li>
                  <li>The invitation ID may be invalid</li>
                </ul>
              </div>
            </div>
          </div>
          
          {import.meta.env.DEV && debugInfo && (
            <div className="mt-4 p-2 bg-gray-100 rounded text-left">
              <details className="text-xs">
                <summary className="font-medium cursor-pointer">Debug Info</summary>
                <pre className="mt-2 overflow-auto max-h-40 text-gray-700">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button onClick={refetchInvite} variant="default" className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" /> Try Again
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
              {status === 'auth_required' && "Authentication Required"}
              {status === 'accepted' || acceptSuccess ? "Invitation Accepted" : ""}
            </CardTitle>
            <CardDescription>
              {status === 'checking' && "Please wait while we verify your invitation..."}
              {status === 'valid' && inviteData?.sender_name && `${inviteData.sender_name} has invited you to collaborate`}
              {status === 'invalid' && "This invitation link is invalid or cannot be found"}
              {status === 'expired' && "This invitation has expired"}
              {status === 'auth_required' && "You need to sign in to view this invitation"}
              {(status === 'accepted' || acceptSuccess) && "You've successfully connected with your partner!"}
            </CardDescription>
          </CardHeader>

          <CardContent className="text-center">
            {validationLoading ? (
              <LoadingSpinner size="lg" text="Checking invitation status..." />
            ) : (
              <InviteStatusDisplay status={acceptSuccess ? 'accepted' : status} senderName={inviteData?.sender_name} onRetry={refetchInvite} />
            )}
            
            {status === 'invalid' && validationError && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-left">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Invitation Error Details</p>
                    <p className="text-xs text-amber-700 mt-1">{validationError.message}</p>
                  </div>
                </div>
              </div>
            )}
            
            {import.meta.env.DEV && debugInfo && (
              <div className="mt-4 p-2 bg-gray-100 rounded text-left">
                <details className="text-xs">
                  <summary className="font-medium cursor-pointer">Debug Info</summary>
                  <pre className="mt-2 overflow-auto max-h-40 text-gray-700">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </details>
              </div>
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
                      <p className="text-sm text-muted-foreground text-center mt-2">
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
                </motion.div>
              )}

              {status === 'auth_required' && (
                <motion.div
                  className="w-full"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Button 
                    onClick={() => navigate(`/auth?invite_id=${inviteId}`)} 
                    className="w-full"
                    variant="default"
                  >
                    Sign in to continue
                  </Button>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Authentication is required to view this invitation.
                  </p>
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
                    <p className="text-sm text-muted-foreground mb-2">
                      Please ask your partner to send you a new invitation.
                    </p>
                  )}
                  <Button onClick={() => navigate("/")} variant="outline" className="w-full">
                    Return Home
                  </Button>
                  <Button onClick={refetchInvite} variant="ghost" size="sm" className="w-full">
                    Try Again
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
                  <p className="text-sm text-muted-foreground mb-3 text-center">
                    Redirecting to your dashboard...
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
