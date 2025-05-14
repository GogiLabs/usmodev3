import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase-client";
import { InviteAcceptance } from "@/components/common/InviteAcceptance";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { NetworkErrorAlert } from "@/components/common/NetworkErrorAlert";
import { Header } from "@/components/common/Header";
import { motion } from "framer-motion";

const InvitePage = () => {
  const [searchParams] = useSearchParams();
  const [inviteValid, setInviteValid] = useState<null | boolean>(null);
  const [inviteId, setInviteId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get("inviteId");
    setInviteId(id);

    if (!id) {
      setInviteValid(false);
      return;
    }

    const checkInvite = async () => {
      const { data, error } = await supabase
        .from("invites")
        .select("id")
        .eq("id", id)
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (error || !data) {
        setInviteValid(false);
      } else {
        setInviteValid(true);
      }
    };

    checkInvite();
  }, [searchParams]);

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
        {inviteValid === null ? (
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
        ) : inviteValid ? (
          <motion.div
            className="w-full"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <InviteAcceptance inviteId={inviteId!} />
          </motion.div>
        ) : (
          <Alert className="max-w-md">
            <AlertDescription>
              This invitation link is invalid or has been revoked. Please ask your partner to send a new one.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </motion.div>
  );
};

export default InvitePage;
