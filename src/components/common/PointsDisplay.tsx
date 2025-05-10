
import { useTask } from "@/contexts/TaskContext";
import { useReward } from "@/contexts/RewardContext";
import { Heart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { usePair, usePairPoints } from "@/hooks/use-supabase-data";
import { useAuth } from "@/contexts/AuthContext";

interface PointsDisplayProps {
  className?: string;
}

export function PointsDisplay({ className }: PointsDisplayProps) {
  const { earnedPoints: localEarnedPoints } = useTask();
  const { spentPoints: localSpentPoints } = useReward();
  const [isAnimating, setIsAnimating] = useState(false);
  const { isAuthenticated } = useAuth();
  const { data: pair } = usePair();
  const { data: pairPoints } = usePairPoints(pair?.id);

  // Calculate points based on whether we're using local storage or Supabase
  const earnedPoints = isAuthenticated && pairPoints ? pairPoints.total_earned : localEarnedPoints;
  const spentPoints = isAuthenticated && pairPoints ? pairPoints.total_spent : localSpentPoints;
  const availablePoints = isAuthenticated && pairPoints ? pairPoints.available : (localEarnedPoints - localSpentPoints);
  
  const [previousPoints, setPreviousPoints] = useState(availablePoints);
  
  // Detect changes to trigger animation
  useEffect(() => {
    if (availablePoints !== previousPoints) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1500);
      setPreviousPoints(availablePoints);
      return () => clearTimeout(timer);
    }
  }, [availablePoints, previousPoints]);

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
      <div className="text-sm font-medium flex items-center gap-1">
        <span className={cn(
          "text-primary transition-all",
          isAnimating ? "text-lg font-bold" : ""
        )}>
          {availablePoints}
        </span>
        <span className="text-muted-foreground"> points available</span>
      </div>
    </div>
  );
}
