
import { useUserPoints } from "@/hooks/use-user-points";
import { Heart, Loader2, Sparkles, Star, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface PointsDisplayProps {
  className?: string;
}

export function PointsDisplay({ className }: PointsDisplayProps) {
  const { points, loading, refetch } = useUserPoints();
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastPoints, setLastPoints] = useState<number | null>(null);
  const [pointDelta, setPointDelta] = useState<number>(0);
  const [showDelta, setShowDelta] = useState(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const deltaTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pointsRef = useRef<number | null>(null);
  
  const { isAuthenticated } = useAuth();

  // Periodically refresh points if authenticated to ensure we have latest data
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Refresh points every 30 seconds
    const intervalId = setInterval(() => {
      console.log(`🔄 [PointsDisplay] Periodic points refresh triggered`);
      refetch();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [isAuthenticated, refetch]);

  // Calculate available points (safely handle case where points might be null)
  const earnedPoints = points?.earned_points || 0;
  const spentPoints = points?.spent_points || 0;
  const availablePoints = points?.available_points || 0;
  
  // Compare current points with previous points whenever points update
  const compareAndAnimatePoints = useCallback(() => {
    if (loading || !points) return;
    
    console.log(`🔍 [PointsDisplay] Checking for points changes. Current: ${availablePoints}, Previous ref: ${pointsRef.current}`);
    
    // Skip initial load animation
    if (pointsRef.current === null) {
      pointsRef.current = availablePoints;
      setLastPoints(availablePoints);
      console.log(`🏁 [PointsDisplay] Initial points set: ${availablePoints}`);
      return;
    }
    
    // Only trigger animation if points actually changed
    if (availablePoints !== pointsRef.current) {
      // Calculate the delta
      const delta = availablePoints - pointsRef.current;
      
      // Update state to trigger animations
      setPointDelta(delta);
      setIsAnimating(true);
      setShowDelta(true);
      
      console.log(`📊 [PointsDisplay] Points changed from ${pointsRef.current} to ${availablePoints} (delta: ${delta})`);
      
      // Clear animations after delay
      if (deltaTimeoutRef.current) clearTimeout(deltaTimeoutRef.current);
      deltaTimeoutRef.current = setTimeout(() => {
        setShowDelta(false);
      }, 1500);
      
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
      }, 1800);
      
      // Update references
      setLastPoints(availablePoints);
      pointsRef.current = availablePoints;
    }
  }, [availablePoints, loading, points]);
  
  // Detect changes in points to trigger animation
  useEffect(() => {
    compareAndAnimatePoints();
    
    // Cleanup function
    return () => {
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      if (deltaTimeoutRef.current) clearTimeout(deltaTimeoutRef.current);
    };
  }, [points, compareAndAnimatePoints]);

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
          animate={isAnimating ? { scale: [1, 1.08, 1] } : { scale: 1 }}
          transition={{ duration: 0.5 }}
          onClick={() => {
            console.log(`🖱️ [PointsDisplay] Points display clicked, triggering refetch`);
            refetch();
          }}
        >
          <div className="relative">
            <AnimatePresence>
              {isAnimating && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1.2 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute -top-1 -right-1"
                >
                  <Sparkles className="h-4 w-4 text-accent" />
                </motion.div>
              )}
            </AnimatePresence>
            
            <motion.div
              animate={isAnimating ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.5 }}
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
                    "absolute -top-5 right-0 text-sm font-bold",
                    pointDelta > 0 ? "text-green-600" : "text-red-600"
                  )}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
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
                scale: [1, 1.2, 1],
                color: ['#9b87f5', '#ec4899', '#9b87f5']
              } : {}}
              transition={{ duration: 0.8 }}
              key={availablePoints} // Force re-render when points change
            >
              {availablePoints}
            </motion.span>
            
            <motion.div
              animate={isAnimating ? { rotate: [0, 360] } : {}}
              transition={{ duration: 0.8 }}
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
