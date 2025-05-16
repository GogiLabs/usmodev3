
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { InviteStatusDisplay } from "@/components/invite/InviteStatus";
import { useState, useEffect } from "react";

type InviteStatus = "checking" | "valid" | "invalid" | "accepted" | "expired" | "auth_required";

type InviteAcceptanceCardProps = {
  status: InviteStatus;
  loading: boolean;
  error: Error | null;
  senderName?: string;
  inviteId: string | null;
  isAuthenticated: boolean;
  onAccept: () => void;
  acceptLoading: boolean;
  acceptSuccess: boolean;
  onRetry: () => void;
  debugInfo?: any;
};

export function InviteAcceptanceCard({
  status,
  loading,
  error,
  senderName,
  inviteId,
  isAuthenticated,
  onAccept,
  acceptLoading,
  acceptSuccess,
  onRetry,
  debugInfo
}: InviteAcceptanceCardProps) {
  const navigate = useNavigate();
  
  // Calculate card title based on status
  const getCardTitle = () => {
    if (status === 'checking') return "Checking Invitation";
    if (status === 'valid') return "Join Your Partner";
    if (status === 'invalid') return "Invalid Invitation";
    if (status === 'expired') return "Expired Invitation";
    if (status === 'auth_required') return "Authentication Required";
    if (status === 'accepted' || acceptSuccess) return "Invitation Accepted";
    return "Invitation";
  };
  
  // Calculate card description based on status
  const getCardDescription = () => {
    if (status === 'checking') return "Please wait while we verify your invitation...";
    if (status === 'valid' && senderName) return `${senderName} has invited you to collaborate`;
    if (status === 'invalid') return "This invitation link is invalid or cannot be found";
    if (status === 'expired') return "This invitation has expired";
    if (status === 'auth_required') return "You need to sign in to view this invitation";
    if (status === 'accepted' || acceptSuccess) return "You've successfully connected with your partner!";
    return "";
  };
  
  // Calculate card class based on status
  const getCardTitleClass = () => {
    if (status === 'expired' || status === 'invalid') return "text-amber-500";
    if (status === 'accepted' || acceptSuccess) return "text-green-500";
    return "";
  };
  
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
            <CardTitle className={getCardTitleClass()}>
              {getCardTitle()}
            </CardTitle>
            <CardDescription>
              {getCardDescription()}
            </CardDescription>
          </CardHeader>

          <CardContent className="text-center">
            {loading ? (
              <LoadingSpinner size="lg" text="Checking invitation status..." />
            ) : (
              <InviteStatusDisplay 
                status={acceptSuccess ? 'accepted' as InviteStatus : status} 
                senderName={senderName} 
                onRetry={onRetry} 
              />
            )}
            
            {status === 'invalid' && error && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-left">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Invitation Error Details</p>
                    <p className="text-xs text-amber-700 mt-1">{error.message}</p>
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
                      onClick={onAccept} 
                      className="w-full" 
                      disabled={loading || acceptLoading || acceptSuccess}
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
                  <Button onClick={onRetry} variant="ghost" size="sm" className="w-full">
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
