
import { useTask } from "@/contexts/TaskContext";
import { useReward } from "@/contexts/RewardContext";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface PointsDisplayProps {
  className?: string;
}

export function PointsDisplay({ className }: PointsDisplayProps) {
  const { earnedPoints } = useTask();
  const { spentPoints } = useReward();
  
  const currentPoints = earnedPoints - spentPoints;
  
  return (
    <div className={cn(
      "flex items-center bg-gradient-to-r from-pink-100 to-purple-100 px-4 py-2 rounded-full shadow-sm",
      className
    )}>
      <Heart className="h-5 w-5 text-primary mr-2 animate-pulse" />
      <div className="text-sm font-medium">
        <span className="text-primary">{currentPoints}</span>
        <span className="text-muted-foreground"> points available</span>
      </div>
    </div>
  );
}
