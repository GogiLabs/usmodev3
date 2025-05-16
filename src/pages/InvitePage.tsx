
import { Header } from "@/components/common/Header";
import { InviteAcceptance } from "@/components/common/InviteAcceptance";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useConnectionStatus } from "@/hooks/use-connection-status";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { NetworkErrorAlert } from "@/components/common/NetworkErrorAlert";
import { InviteHandler } from "@/components/common/InviteHandler";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast-wrapper";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn } from "lucide-react";

const InvitePage = () => {
  const { isOffline } = useConnectionStatus();
  const { isAuthenticated, user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const inviteId = searchParams.get("invite_id") || searchParams.get("inviteId");
  const [noIdWarningVisible, setNoIdWarningVisible] = useState(false);
  const [redirectingToAuth, setRedirectingToAuth] = useState(false);

  useEffect(() => {
    console.log("🔍 InvitePage useEffect - Invite ID from URL:", inviteId);
    console.log("🔍 InvitePage auth state:", { isAuthenticated, user });
    
    if (!inviteId) {
      // Show warning about missing invite ID after a short delay
      const timer = setTimeout(() => {
        setNoIdWarningVisible(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
    
    // Store the invite ID for after authentication
    if (inviteId && !isAuthenticated) {
      console.log("💾 Storing pending invite ID for post-authentication flow");
      localStorage.setItem("pending_invite_id", inviteId);
      
      // Short delay before redirecting to give user context
      const timer = setTimeout(() => {
        console.log("🔀 Redirecting to auth with invite_id:", inviteId);
        setRedirectingToAuth(true);
        navigate(`/auth?invite_id=${inviteId}`);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
    
    if (inviteId && isAuthenticated) {
      // Only try to initialize the invite context when authenticated
      const setInviteContext = async () => {
        console.log("🔄 Attempting to set invite context after authentication");
        try {
          // Try up to 3 times with backoff
          for (let i = 0; i < 3; i++) {
            try {
              console.log(`🔄 Context init attempt ${i+1} for invite:`, inviteId);
              await supabase.rpc('set_invite_context' as any, { invite_id: inviteId });
              console.log("✅ Invite context initialized after authentication");
              break;
            } catch (retryError) {
              console.warn(`⚠️ Context init attempt ${i+1} failed:`, retryError);
              await new Promise(r => setTimeout(r, 200 * (i + 1)));
            }
          }
        } catch (error) {
          console.error("❌ Failed to initialize invite context:", error);
          toast({
            title: "Connection issue",
            description: "There was a problem connecting to the server. Retrying...",
            variant: "destructive"
          });
        }
      };
      
      // Now that we're authenticated, we can set the invite context
      setInviteContext();
      
      // Remove the stored invite ID as we're now handling it
      localStorage.removeItem("pending_invite_id");
    }
  }, [inviteId, isAuthenticated, navigate]);
  
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
        ) : !isAuthenticated && inviteId ? (
          <motion.div 
            className="w-full max-w-md"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-center mb-4">Authentication Required</h2>
              <p className="text-muted-foreground text-center mb-6">
                You need to sign in or create an account to view and accept this invitation.
              </p>
              
              {redirectingToAuth ? (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="w-8 h-8 border-4 border-t-primary rounded-full animate-spin"></div>
                  <p className="text-sm text-muted-foreground">Redirecting to authentication...</p>
                </div>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={() => navigate(`/auth?invite_id=${inviteId}`)}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Continue to Sign In
                </Button>
              )}
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
