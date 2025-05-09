
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, Save, UserPlus } from "lucide-react";

export function AuthRequiredBanner() {
  const { login } = useAuth();
  
  // Create proper event handlers for the buttons
  const handleLogin = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    login();
  };
  
  const handleSignUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    login();
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-primary/90 to-accent/90 backdrop-blur-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between z-50 space-y-2 sm:space-y-0">
      <div className="text-white max-w-md">
        <h3 className="font-semibold text-base flex items-center gap-2">
          <Save className="h-4 w-4" />
          Your data is saved locally
        </h3>
        <p className="text-white/80 text-sm leading-tight">
          Tasks and rewards are stored on this device. Sign up to sync across devices and share with your partner.
        </p>
      </div>
      <div className="flex space-x-2 self-end sm:self-center">
        <Button 
          variant="secondary" 
          className="text-accent"
          onClick={handleLogin}
        >
          <LogIn className="h-4 w-4 mr-2" />
          Sign In
        </Button>
        <Button 
          className="bg-white text-primary hover:bg-white/90"
          onClick={handleSignUp}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Sign Up
        </Button>
      </div>
    </div>
  );
}
