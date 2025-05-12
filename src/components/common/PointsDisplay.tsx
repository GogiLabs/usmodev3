
import { useTask } from "@/contexts/task/TaskContext";
import { useReward } from "@/contexts/reward/RewardContext";
import { Heart, Loader2, Sparkles, Star, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { usePair, usePairPoints } from "@/hooks/use-supabase-data";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface PointsDisplayProps {
  className?: string;
}

export function PointsDisplay({ className }: PointsDisplayProps) {
  const { earnedPoints: localEarnedPoints, loadingTasks } = useTask();
  const { spentPoints: localSpentPoints, loadingRewards } = useReward();
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastPoints, setLastPoints] = useState<number | null>(null);
  const [pointDelta, setPointDelta] = useState<number>(0);
  
  const { isAuthenticated } = useAuth();
  const { data: pair } = usePair();
  const { data: pairPoints, isLoading: pairPointsLoading } = usePairPoints(pair?.id);

  const loading = (isAuthenticated && (loadingTasks || loadingRewards || pairPointsLoading));

  // Calculate points based on whether we're using local storage or Supabase
  const earnedPoints = isAuthenticated && pairPoints ? pairPoints.total_earned : localEarnedPoints;
  const spentPoints = isAuthenticated && pairPoints ? pairPoints.total_spent : localSpentPoints;
  const availablePoints = isAuthenticated && pairPoints ? pairPoints.available : (localEarnedPoints - localSpentPoints);
  
  // Detect changes to trigger animation
  useEffect(() => {
    if (loading) return;
    
    if (lastPoints !== null && availablePoints !== lastPoints) {
      // Calculate the delta
      const delta = availablePoints - lastPoints;
      setPointDelta(delta);
      
      // Trigger animation
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1500);
      
      return () => clearTimeout(timer);
    }
    
    setLastPoints(availablePoints);
  }, [availablePoints, lastPoints, loading]);

  if (loading) {
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
      <HoverCardTrigger>
        <motion.div 
          className={cn(
            "flex items-center gap-2 bg-gradient-to-r from-pink-100 to-purple-100 px-4 py-2 rounded-full shadow-sm transition-all duration-300",
            isAnimating && "from-pink-200 to-purple-200",
            className
          )}
          initial={{ scale: 1 }}
          animate={isAnimating ? { scale: 1.1 } : { scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative">
            <AnimatePresence>
              {isAnimating && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1.2 }}
                  exit={{ scale: 0 }}
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
              <Heart className="h-5 w-5 text-primary" />
            </motion.div>
          </div>
          
          <div className="text-sm font-medium flex items-center gap-1 relative">
            <AnimatePresence>
              {isAnimating && pointDelta !== 0 && (
                <motion.span 
                  className={cn(
                    "absolute -top-5 right-0 text-sm font-bold",
                    pointDelta > 0 ? "text-green-600" : "text-red-600"
                  )}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {pointDelta > 0 ? `+${pointDelta}` : pointDelta}
                </motion.span>
              )}
            </AnimatePresence>
              
            <motion.span
              className="text-primary"
              animate={isAnimating ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              {availablePoints}
            </motion.span>
            
            <Star className={cn(
              "h-3 w-3 text-primary",
              isAnimating && "animate-spin-slow"
            )} 
            fill={isAnimating ? "currentColor" : "none"} />
            
            <span className="text-muted-foreground">points</span>
          </div>
        </motion.div>
      </HoverCardTrigger>
      
      <HoverCardContent className="w-64">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Points Breakdown</h4>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4 text-green-600" />
              <span>Earned</span>
            </div>
            <span className="text-right font-medium">{earnedPoints} points</span>
            
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4 text-red-600" />
              <span>Spent</span>
            </div>
            <span className="text-right font-medium">{spentPoints} points</span>
            
            <div className="col-span-2 h-px bg-border my-1"></div>
            
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4 text-primary" />
              <span>Available</span>
            </div>
            <span className="text-right font-medium text-primary">{availablePoints} points</span>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
