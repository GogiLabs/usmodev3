
import { Heart, User } from "lucide-react";
import { usePairDetails } from "@/hooks/use-supabase-data";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export function PairedUserBanner() {
  const { user } = useAuth();
  const { data: pairDetails, isLoading } = usePairDetails();
  
  // Determine if user is paired
  const isPaired = pairDetails?.user_1_id && pairDetails?.user_2_id;
  
  // Determine if the current user is user_1 or user_2
  const isUserOne = user?.id === pairDetails?.user_1_id;
  
  // Get partner details
  const partnerName = isUserOne ? pairDetails?.user_2_name : pairDetails?.user_1_name;
  const partnerAvatar = isUserOne ? pairDetails?.user_2_avatar : pairDetails?.user_1_avatar;
  
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 bg-gradient-to-r from-pink-50 to-purple-50 px-4 py-2 rounded-lg animate-pulse">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-40" />
      </div>
    );
  }
  
  if (!isPaired) {
    return null;
  }
  
  return (
    <div className={cn(
      "flex items-center gap-2 bg-gradient-to-r from-pink-50 to-purple-50 px-4 py-2 rounded-lg",
      "animate-fade-in transition-all duration-300"
    )}>
      <Avatar className="h-8 w-8 border-2 border-pink-200">
        <AvatarImage src={partnerAvatar || undefined} alt={partnerName || "Partner"} />
        <AvatarFallback>
          <User className="h-4 w-4 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>
      
      <div className="flex items-center">
        <span className="text-sm font-medium">Paired with </span>
        <span className="text-sm font-bold text-primary ml-1">
          {partnerName || "Partner"}
        </span>
      </div>
      
      <Heart className="h-4 w-4 text-pink-500 ml-1" />
    </div>
  );
}
