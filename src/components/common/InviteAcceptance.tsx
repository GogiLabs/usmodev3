
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
    console.log("🔍 [InviteAcceptance] Component mounted with inviteId:", inviteId);
    console.log("🔍 [InviteAcceptance] Auth state:", { 
      isAuthenticated, 
      userId: user?.id 
    });
  }, [inviteId, isAuthenticated, user]);

  // Get invite validation from hook
  const {
    status,
    inviteData,
    loading: validationLoading,
    error: validationError,
    refetch: refetchInvite,
    contextSetAttempts
  } = useInviteValidation(inviteId);

  // Log validation result
  useEffect(() => {
    console.log("🔍 [InviteAcceptance] Validation update:", { 
      status, 
      inviteDataPresent: !!inviteData,
      pairId: inviteData?.pair_id,
      validationLoading, 
      error: validationError?.message 
    });
  }, [status, inviteData, validationLoading, validationError]);

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
      console.log("⏱️ [InviteAcceptance] Checking if we're stuck in validation...");
      const timer = setTimeout(() => {
        setValidationAttempts(prev => {
          const newCount = prev + 1;
          console.log(`⚠️ [InviteAcceptance] Validation taking too long, attempt ${newCount}`);
          // If we've already tried 3 times, force an invalid state
          if (newCount >= 3) {
            console.log("⛔ [InviteAcceptance] Invite validation timed out after multiple attempts");
            setNetworkError(new Error("Invitation validation timed out. Please try again."));
            return newCount;
          }
          // Otherwise, try refetching
          refetchInvite();
          return newCount;
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
      contextSetAttempts,
      isLoading: validationLoading
    };
    
    console.log("📬 [InviteAcceptance] Current state:", debugData);
    setDebugInfo(debugData);
  }, [status, inviteData, inviteId, user, isAuthenticated, validationAttempts, contextSetAttempts, validationLoading]);

  // Log errors for debugging
  useEffect(() => {
    if (validationError) {
      console.error("❌ [InviteAcceptance] Validation Error:", validationError);
    }
    if (acceptError) {
      console.error("❌ [InviteAcceptance] Acceptance Error:", acceptError);
    }
  }, [validationError, acceptError]);

  // Handle successful acceptance
  useEffect(() => {
    if (acceptSuccess) {
      console.log("🎉 [InviteAcceptance] Successfully connected with partner!");
      sonnerToast.success("Connection established!", {
        description: "You've successfully paired with your partner.",
        duration: 5000,
      });
    }
  }, [acceptSuccess]);

  // Handle the accept invite action
  const handleAcceptInvite = async () => {
    try {
      console.log("🚀 [InviteAcceptance] Starting invite acceptance process");
      clearError();
      const result = await acceptInvite();
      console.log("✅ [InviteAcceptance] Acceptance result:", result);
      if (result === "accepted") {
        console.log("🎉 [InviteAcceptance] Setting acceptance success state to true");
        setAcceptSuccess(true);
      }
    } catch (error) {
      console.error("❌ [InviteAcceptance] Error accepting invite:", error);
    }
  };

  // If no invite ID provided, show invalid invitation card
  if (!inviteId) {
    console.log("❌ [InviteAcceptance] No invite ID found in URL");
    return (
      <InvalidInviteCard
        reason="No invitation ID was provided."
        details="The invitation link you followed is incomplete or invalid. Please check your email for the correct invitation link."
      />
    );
  }

  // If network error, show error card
  if (networkError && !validationLoading) {
    console.log("🌐 Network error displayed:", networkError.message);
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
    console.log("⌛ Displaying timeout UI after multiple validation attempts");
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
    console.log("🚫 Displaying invalid invite card due to validation error");
    return (
      <InvalidInviteCard
        reason={validationError?.message || "This invitation doesn't exist or has been revoked."}
        showDebugInfo={true}
        debugData={debugInfo}
      />
    );
  }

  // Default case: show the invite acceptance card
  console.log("📝 Rendering acceptance card with status:", status);
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
