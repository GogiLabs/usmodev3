
import { InviteHandler } from "@/components/common/InviteHandler";
import { Button } from "@/components/ui/button";
import { UsersRound, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePairDetails } from "@/hooks/use-supabase-data";

interface EmptyStateBannerProps {
  type?: "tasks" | "rewards";
}

export function EmptyStateBanner({ type = "tasks" }: EmptyStateBannerProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { data: pairDetails, isLoading } = usePairDetails();
  
  // Determine if user is paired
  const isPaired = pairDetails?.user_1_id && pairDetails?.user_2_id;
  
  if (isLoading || isPaired) {
    return null;
  }
  
  if (!isAuthenticated) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 animate-fade-in">
        <div className="flex items-center mb-2">
          <UsersRound className="text-blue-500 mr-2 h-5 w-5" />
          <h3 className="font-medium">Sign in to sync your data</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Create an account to invite your partner and sync your tasks and rewards across devices.
        </p>
        <Button 
          size="sm" 
          onClick={() => navigate('/auth')}
          className="w-full sm:w-auto"
        >
          Sign in or Create Account <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    );
  }
  
  return (
    <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 mb-6 animate-fade-in">
      <div className="flex items-center mb-2">
        <UsersRound className="text-pink-500 mr-2 h-5 w-5" />
        <h3 className="font-medium">Invite your partner</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        To get the most out of this app, invite your partner to join you and start collaborating.
      </p>
      <div className="flex justify-center">
        <InviteHandler />
      </div>
    </div>
  );
}
