
import { Header } from "@/components/common/Header";
import { InviteAcceptance } from "@/components/common/InviteAcceptance";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useConnectionStatus } from "@/hooks/use-connection-status";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { NetworkErrorAlert } from "@/components/common/NetworkErrorAlert";
import { WifiOff } from "lucide-react";

const InvitePage = () => {
  const { isOffline } = useConnectionStatus();
  
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
        {isOffline && (
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
        )}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <InviteAcceptance />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default InvitePage;
