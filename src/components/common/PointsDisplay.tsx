
import { useUserPoints } from "@/hooks/use-user-points";
import { Heart, Loader2, Sparkles, Star, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export interface PointsDisplayHandle {
  animatePoints: (newPoints: number, previousPoints: number) => void;
}

interface PointsDisplayProps {
  className?: string;
}

export const PointsDisplay = forwardRef<PointsDisplayHandle, PointsDisplayProps>(
  ({ className }, ref) => {
    const { points, loading, refetch, subscribeToPointsUpdates } = useUserPoints();
    const [isAnimating, setIsAnimating] = useState(false);
    const [lastPoints, setLastPoints] = useState<number | null>(null);
    const [pointDelta, setPointDelta] = useState<number>(0);
    const [showDelta, setShowDelta] = useState(false);
    const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const deltaTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const animationPendingRef = useRef<boolean>(false);
    const updateIdRef = useRef<number>(0);
    const listenerRegistered = useRef<boolean>(false);
    const unsubscribeRef = useRef<(() => void) | null>(null);
    
    const { isAuthenticated } = useAuth();

    // Calculate available points (safely handle case where points might be null)
    const earnedPoints = points?.earned_points || 0;
    const spentPoints = points?.spent_points || 0;
    const availablePoints = points?.available_points || 0;

    // Function to trigger animation
    const animatePointsChange = useCallback((newPoints: number, previousPoints: number) => {
      // Skip if no change or if we don't know the previous points
      if (previousPoints === null || newPoints === previousPoints) {
        console.log(`🚫 [PointsDisplay] No points change to animate: ${previousPoints} -> ${newPoints}`);
        return;
      }
      
      const delta = newPoints - previousPoints;
      updateIdRef.current += 1;
      const currentUpdateId = updateIdRef.current;
      
      console.log(`✨ [PointsDisplay] Triggering animation: points ${previousPoints} -> ${newPoints}, delta ${delta} (update ID: ${currentUpdateId})`);
      
      // Clear any pending animations
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      if (deltaTimeoutRef.current) clearTimeout(deltaTimeoutRef.current);
      
      // Set animation states
      setPointDelta(delta);
      setIsAnimating(true);
      setShowDelta(true);
      setLastPoints(newPoints);
      
      // Clear animations after delay
      deltaTimeoutRef.current = setTimeout(() => {
        setShowDelta(false);
      }, 2000); // 2000ms visibility for delta
      
      animationTimeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
        animationPendingRef.current = false;
      }, 2300); // 2300ms for animation
    }, []);

    // Expose the animatePointsChange method via ref
    useImperativeHandle(ref, () => ({
      animatePoints: animatePointsChange
    }), [animatePointsChange]);

    // Initialize lastPoints when points first load
    useEffect(() => {
      if (points && lastPoints === null) {
        console.log(`🏁 [PointsDisplay] Initializing lastPoints to:`, points.available_points);
        setLastPoints(points.available_points);
      }
    }, [points, lastPoints]);
    
    // Set up points update subscription - SINGLE REGISTRATION ONLY
    useEffect(() => {
      if (!isAuthenticated) {
        console.log(`⚠️ [PointsDisplay] Not authenticated, skipping listener setup`);
        return;
      }
      
      if (listenerRegistered.current) {
        console.log(`⚠️ [PointsDisplay] Listener already registered, skipping duplicate setup`);
        return;
      }
      
      console.log(`🔌 [PointsDisplay] Setting up points update subscription immediately`);
      listenerRegistered.current = true;
      
      const unsubscribe = subscribeToPointsUpdates((newPointsData) => {
        const newPointsValue = newPointsData.available_points;
        const previousPointsValue = lastPoints === null ? newPointsValue : lastPoints;
        
        console.log(`📊 [PointsDisplay] Points update received: ${previousPointsValue} -> ${newPointsValue}`);
        
        if (previousPointsValue !== newPointsValue) {
          // Handle animation queuing
          if (animationPendingRef.current) {
            console.log(`🔄 [PointsDisplay] Animation already pending, updating final target to: ${newPointsValue}`);
          } else {
            animationPendingRef.current = true;
            animatePointsChange(newPointsValue, previousPointsValue);
          }
        }
      });
      
      // Store the unsubscribe function
      unsubscribeRef.current = unsubscribe;
      
      return () => {
        console.log('🔌 [PointsDisplay] Cleaning up points subscription');
        listenerRegistered.current = false;
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      };
    }, [isAuthenticated]); // MINIMAL DEPENDENCIES - only depend on auth status
    
    // Separate effect to handle the animation callback when lastPoints changes
    useEffect(() => {
      if (listenerRegistered.current && unsubscribeRef.current) {
        // Re-register with updated lastPoints reference
        console.log(`🔄 [PointsDisplay] Updating listener with new lastPoints: ${lastPoints}`);
      }
    }, [lastPoints]);
    
    // Cleanup function - separate from subscription management
    useEffect(() => {
      return () => {
        if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
        if (deltaTimeoutRef.current) clearTimeout(deltaTimeoutRef.current);
      };
    }, []);

    const handleManualRefresh = useCallback(() => {
      console.log(`🖱️ [PointsDisplay] Points display clicked, triggering refetch`);
      refetch();
    }, [refetch]);

    if (loading && !points) {
      return (
        <div className={cn(
          "flex items-center gap-2 bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-2 rounded-full shadow-sm",
          className
        )}>
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
          <Skeleton className="h-5 w-28" />
        </div>
      );
    }

    return (
      <HoverCard openDelay={300} closeDelay={100}>
        <HoverCardTrigger asChild>
          <motion.div 
            className={cn(
              "flex items-center gap-2 bg-gradient-to-r from-pink-100 to-purple-100 px-4 py-2 rounded-full shadow-sm transition-all duration-300 cursor-pointer select-none",
              isAnimating && "from-pink-200 to-purple-200 shadow-md",
              className
            )}
            initial={{ scale: 1 }}
            animate={isAnimating ? { scale: [1, 1.2, 1] } : { scale: 1 }} // Enhanced scale effect
            transition={{ duration: 1.0 }} // Extended animation duration
            onClick={handleManualRefresh}
            data-testid="points-display"
          >
            <div className="relative">
              <AnimatePresence>
                {isAnimating && (
                  <motion.div
                    initial={{ scale: 0, rotate: 0 }}
                    animate={{ scale: 1.8, rotate: 720 }} // More rotation and increased scale
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 1.2 }} // Extended duration
                    className="absolute -top-1 -right-1"
                  >
                    <Sparkles className="h-4 w-4 text-yellow-400" />
                  </motion.div>
                )}
              </AnimatePresence>
              
              <motion.div
                animate={isAnimating ? { 
                  scale: [1, 1.8, 1],
                  rotate: [0, 25, -25, 0] // Enhanced wiggle effect
                } : {}}
                transition={{ duration: 1.0 }}
              >
                <Heart className={cn(
                  "h-5 w-5 text-primary transition-all", 
                  isAnimating && "text-rose-500"
                )} />
              </motion.div>
            </div>
            
            <div className="text-sm font-medium flex items-center gap-1 relative">
              <AnimatePresence mode="wait">
                {showDelta && pointDelta !== 0 && (
                  <motion.span 
                    className={cn(
                      "absolute -top-7 right-0 text-xl font-bold", // Increased size and position
                      pointDelta > 0 ? "text-green-600" : "text-red-600"
                    )}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.7 }} // Extended duration
                    key={`delta-${Date.now()}`}
                  >
                    {pointDelta > 0 ? `+${pointDelta}` : pointDelta}
                  </motion.span>
                )}
              </AnimatePresence>
              
              <motion.span
                className={cn(
                  "text-primary font-semibold transition-all",
                  isAnimating && "text-rose-500"
                )}
                animate={isAnimating ? { 
                  scale: [1, 1.5, 1],
                  color: ['#9b87f5', '#ec4899', '#9b87f5']
                } : {}}
                transition={{ duration: 1.2 }} // Extended duration
                key={availablePoints} // Force re-render when points change
              >
                {availablePoints}
              </motion.span>
              
              <motion.div
                animate={isAnimating ? { 
                  rotate: [0, 720],
                  scale: [1, 1.8, 1] // Enhanced scale effect
                } : {}}
                transition={{ duration: 1.0 }}
              >
                <Star className={cn(
                  "h-3 w-3 text-primary",
                  isAnimating && "text-yellow-500"
                )} 
                fill={isAnimating ? "currentColor" : "none"} />
              </motion.div>
              
              <span className="text-muted-foreground">points</span>
            </div>
          </motion.div>
        </HoverCardTrigger>
        
        <HoverCardContent className="w-64 p-4 shadow-lg">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">My Points</h4>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-green-600" />
                <span>Earned</span>
              </div>
              <span className="text-right font-medium text-green-600">{earnedPoints} points</span>
              
              <div className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-red-600" />
                <span>Spent</span>
              </div>
              <span className="text-right font-medium text-red-600">{spentPoints} points</span>
              
              <div className="col-span-2 h-px bg-border my-1"></div>
              
              <div className="flex items-center gap-1.5">
                <Heart className="h-4 w-4 text-primary" />
                <span>Available</span>
              </div>
              <span className={cn(
                "text-right font-medium",
                availablePoints > 10 ? "text-primary" : availablePoints > 0 ? "text-amber-500" : "text-red-500" 
              )}>
                {availablePoints} points
              </span>
            </div>
            
            {isAuthenticated && (
              <div className="text-xs text-muted-foreground mt-2">
                Points are earned individually when you complete tasks.
                <button 
                  className="block w-full text-center mt-2 text-xs text-primary hover:text-primary/80"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    refetch();
                  }}
                >
                  Refresh Points
                </button>
              </div>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  }
);

PointsDisplay.displayName = "PointsDisplay";
