
import { useTask } from "@/contexts/task/TaskContext";
import { useReward } from "@/contexts/reward/RewardContext";
import { Heart, Loader2, Sparkles, Star, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { usePair, usePairPoints } from "@/hooks/use-supabase-data";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    <div className={cn(
      "flex items-center gap-2 bg-gradient-to-r from-pink-100 to-purple-100 px-4 py-2 rounded-full shadow-sm transition-all duration-300",
      isAnimating && "scale-110 from-pink-200 to-purple-200",
      className
    )}>
      <div className="relative">
        <Heart className={cn(
          "h-5 w-5 text-primary transition-transform",
          isAnimating ? "animate-pulse scale-110" : ""
        )} />
        {isAnimating && (
          <Sparkles className="h-4 w-4 text-accent absolute -top-1 -right-1 animate-pulse" />
        )}
      </div>
      
      <div className="text-sm font-medium flex items-center gap-1 relative">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <span className={cn(
                  "text-primary transition-all",
                  isAnimating ? "text-lg font-bold" : ""
                )}>
                  {availablePoints}
                </span>
                
                {isAnimating && pointDelta !== 0 && (
                  <span className={cn(
                    "absolute -top-5 right-0 text-sm font-bold animate-fade-in",
                    pointDelta > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {pointDelta > 0 ? `+${pointDelta}` : pointDelta}
                  </span>
                )}
                
                <Star className={cn(
                  "h-3 w-3 text-primary",
                  isAnimating && "animate-spin-slow"
                )} 
                fill={isAnimating ? "currentColor" : "none"} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-1">
                  <Award className="h-3 w-3 text-green-600" />
                  <span>Earned: {earnedPoints} points</span>
                </div>
                <div className="flex items-center gap-1">
                  <Award className="h-3 w-3 text-red-600" />
                  <span>Spent: {spentPoints} points</span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <span className="text-muted-foreground">points</span>
      </div>
    </div>
  );
}
