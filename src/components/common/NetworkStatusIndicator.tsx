import { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useConnectionStatus } from "@/hooks/use-connection-status";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NetworkStatusIndicatorProps {
  className?: string;
}

export function NetworkStatusIndicator({ className }: NetworkStatusIndicatorProps) {
  const { isOnline, isOffline } = useConnectionStatus();
  const [isVisible, setIsVisible] = useState(false);
  const [showOfflineTooltip, setShowOfflineTooltip] = useState(false);
  
  // Only show when offline or when recently changed to online
  useEffect(() => {
    if (isOffline) {
      setIsVisible(true);
      setShowOfflineTooltip(true);
      
      // After 5 seconds, hide the offline tooltip but keep the indicator
      const timer = setTimeout(() => {
        setShowOfflineTooltip(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      // When online, show for 3 seconds then hide
      setIsVisible(true);
      setShowOfflineTooltip(false);
      
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isOffline, isOnline]);
  
  // Force a refresh of the page
  const handleRefresh = () => {
    window.location.reload();
  };
  
  return (
    <AnimatePresence>
      {(isVisible || isOffline) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "fixed bottom-4 right-4 z-50",
            className
          )}
        >
          <TooltipProvider>
            <Tooltip open={isOffline && showOfflineTooltip}>
              <TooltipTrigger asChild>
                <motion.div 
                  className={cn(
                    "p-2 rounded-full shadow-md flex items-center justify-center",
                    isOffline ? "bg-red-100" : "bg-green-100"
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={isOffline ? handleRefresh : undefined}
                >
                  {isOffline ? (
                    <div className="flex items-center gap-1">
                      <WifiOff className="h-5 w-5 text-red-600" />
                      <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ) : (
                    <Wifi className="h-5 w-5 text-green-600" />
                  )}
                </motion.div>
              </TooltipTrigger>
              
              {isOffline && (
                <TooltipContent side="top">
                  <p>You are offline. Tap to refresh.</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
