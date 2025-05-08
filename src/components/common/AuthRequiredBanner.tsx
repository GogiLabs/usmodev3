
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, UserPlus } from "lucide-react";

export function AuthRequiredBanner() {
  const { login } = useAuth();
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-primary/90 to-accent/90 backdrop-blur-sm p-4 flex items-center justify-between z-50">
      <div className="text-white">
        <h3 className="font-semibold text-base">Sign up to complete tasks & claim rewards</h3>
        <p className="text-white/80 text-sm">Create an account to track points and sync with your partner</p>
      </div>
      <div className="flex space-x-2">
        <Button 
          variant="secondary" 
          className="text-accent"
          onClick={login}
        >
          <LogIn className="h-4 w-4 mr-2" />
          Sign In
        </Button>
        <Button 
          className="bg-white text-primary hover:bg-white/90"
          onClick={login}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Sign Up
        </Button>
      </div>
    </div>
  );
}
