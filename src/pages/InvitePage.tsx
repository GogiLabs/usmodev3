
import { Header } from "@/components/common/Header";
import { InviteAcceptance } from "@/components/common/InviteAcceptance";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useConnectionStatus } from "@/hooks/use-connection-status";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { NetworkErrorAlert } from "@/components/common/NetworkErrorAlert";
import { InviteHandler } from "@/components/common/InviteHandler";
import { Button } from "@/components/ui/button";

const InvitePage = () => {
  const { isOffline } = useConnectionStatus();
  const [searchParams] = useSearchParams();
  const inviteId = searchParams.get("invite_id") || searchParams.get("inviteId");
  const [noIdWarningVisible, setNoIdWarningVisible] = useState(false);

  useEffect(() => {
    console.log("🔍 Invite ID from URL:", inviteId);
    
    // Show warning about missing invite ID after a short delay
    // This prevents flashing for split-second loading scenarios
    if (!inviteId) {
      const timer = setTimeout(() => {
        setNoIdWarningVisible(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [inviteId]);
  
  // Page transitions for smoother UX
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <motion.div
      className="min-h-screen flex flex-col bg-gradient-to-b from-pink-50 to-purple-50"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {isOffline ? (
          <motion.div
            className="w-full max-w-md mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <NetworkErrorAlert
              message="You're currently offline. Some features may be unavailable."
              onRetry={() => window.location.reload()}
              retryLabel="Refresh Page"
            />
          </motion.div>
        ) : noIdWarningVisible && !inviteId ? (
          <motion.div 
            className="w-full max-w-md"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Alert className="mb-4">
              <AlertDescription>
                This invitation link is invalid or has been revoked. Please ask your partner to send a new one.
              </AlertDescription>
            </Alert>
            
            <div className="mt-6 text-center">
              <h3 className="text-lg font-medium mb-2">Need to invite someone instead?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create and share an invitation link with your partner.
              </p>
              <div className="flex justify-center">
                <InviteHandler />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="w-full"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <InviteAcceptance />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default InvitePage;
