import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { toast as sonnerToast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useInviteValidation } from "@/hooks/useInviteValidation";
import { useInviteAcceptance } from "@/hooks/useInviteAcceptance";
import { NetworkErrorAlert } from "@/components/common/NetworkErrorAlert";
import { motion } from "framer-motion";
import { InvalidInviteCard } from "@/components/invite/InvalidInviteCard";
import { InviteAcceptanceCard } from "@/components/invite/InviteAcceptanceCard";

export function InviteAcceptance() {
  const [searchParams] = useSearchParams();
  const inviteId = searchParams.get("invite_id") || searchParams.get("inviteId");
  const { isAuthenticated, user } = useAuth();
  const [networkError, setNetworkError] = useState<Error | null>(null);
  const [acceptSuccess, setAcceptSuccess] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [validationAttempts, setValidationAttempts] = useState(0);

  // Log the invite ID for debugging
  useEffect(() => {
    console.log("🔍 InviteAcceptance: inviteId =", inviteId);
  }, [inviteId]);

  // Get invite validation from hook
  const {
    status,
    inviteData,
    loading: validationLoading,
    error: validationError,
    refetch: refetchInvite,
    contextSetAttempts
  } = useInviteValidation(inviteId);

  // Get invite acceptance logic from hook
  const {
    acceptInvite,
    loading: acceptLoading,
    error: acceptError,
    clearError
  } = useInviteAcceptance(inviteId, inviteData);

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

  // Set debug info for development
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

  // Log errors for debugging
  useEffect(() => {
    if (validationError) {
      console.error("❌ Validation Error:", validationError);
    }
    if (acceptError) {
      console.error("❌ Acceptance Error:", acceptError);
    }
  }, [validationError, acceptError]);

  // Handle successful acceptance
  useEffect(() => {
    if (acceptSuccess) {
      sonnerToast.success("Connection established!", {
        description: "You've successfully paired with your partner.",
        duration: 5000,
      });
    }
  }, [acceptSuccess]);

  // Handle the accept invite action
  const handleAcceptInvite = async () => {
    try {
      clearError();
      const result = await acceptInvite();
      if (result === "accepted") {
        setAcceptSuccess(true);
      }
    } catch (error) {
      console.error("Error accepting invite:", error);
    }
  };

  // Improve error handling for cases where validation is stuck
  useEffect(() => {
    if (validationAttempts >= 3 && status === 'checking') {
      console.log("⚠️ Forcing invitation status update due to timeout");
      setNetworkError(new Error("Invitation validation timed out. Please try again."));
    }
  }, [validationAttempts, status]);

  // If no invite ID provided, show invalid invitation card
  if (!inviteId) {
    return (
      <InvalidInviteCard
        reason="No invitation ID was provided."
        details="The invitation link you followed is incomplete or invalid. Please check your email for the correct invitation link."
      />
    );
  }

  // If network error, show error card
  if (networkError && !validationLoading) {
    return (
      <motion.div className="w-full max-w-md mx-auto">
        <NetworkErrorAlert 
          message={networkError.message || "Failed to load invitation details. Please check your connection."} 
          onRetry={refetchInvite}
          className="mb-4"
        />
        <div className="flex flex-col space-y-2">
          <button 
            onClick={refetchInvite} 
            className="w-full bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  // If validation timeout, show timeout UI
  if (validationAttempts >= 3 && status === 'checking') {
    return (
      <InvalidInviteCard
        reason="Invitation Check Timed Out"
        details="We're having trouble verifying this invitation. The invitation may have been deleted or expired, or there may be a connection issue."
        showDebugInfo={true}
        debugData={{ inviteId, attempts: validationAttempts, error: validationError?.message }}
      />
    );
  }

  // If validation error, show error card
  if (status === 'invalid' && validationError) {
    return (
      <InvalidInviteCard
        reason={validationError?.message || "This invitation doesn't exist or has been revoked."}
        showDebugInfo={true}
        debugData={debugInfo}
      />
    );
  }

  // Default case: show the invite acceptance card
  return (
    <InviteAcceptanceCard
      status={status}
      loading={validationLoading}
      error={validationError}
      senderName={inviteData?.sender_name}
      inviteId={inviteId}
      isAuthenticated={isAuthenticated}
      onAccept={handleAcceptInvite}
      acceptLoading={acceptLoading}
      acceptSuccess={acceptSuccess}
      onRetry={refetchInvite}
      debugInfo={import.meta.env.DEV ? debugInfo : undefined}
    />
  );
}
