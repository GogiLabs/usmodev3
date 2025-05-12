
import { useEffect, useState } from "react";
import { useConnectionStatus } from "@/hooks/use-connection-status";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function NetworkStatusIndicator() {
  const { isOnline, isOffline } = useConnectionStatus();
  const [visible, setVisible] = useState(false);
  const [recentlyChanged, setRecentlyChanged] = useState(false);
  
  useEffect(() => {
    // Show indicator on network status change
    setVisible(true);
    setRecentlyChanged(true);
    
    // Hide automatically after 5 seconds, but only for online status
    const timer = setTimeout(() => {
      if (isOnline) setVisible(false);
      setRecentlyChanged(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [isOnline, isOffline]);
  
  const handleDismiss = () => {
    setVisible(false);
  };
  
  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 inset-x-0 flex justify-center z-50 px-4"
        style={{ maxWidth: "430px", margin: "0 auto" }}
      >
        <div 
          className={cn(
            "flex items-center gap-2 py-2 px-4 rounded-full shadow-lg",
            isOnline 
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          )}
        >
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5 }}
          >
            {isOnline ? (
              <Wifi className="h-4 w-4" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
          </motion.div>
          
          <span className="text-sm font-medium">
            {isOnline ? "Back online" : "You're offline"}
          </span>
          
          {(isOnline || !recentlyChanged) && (
            <button 
              onClick={handleDismiss}
              className="ml-2 p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
