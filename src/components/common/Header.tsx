
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { PointsDisplay } from "./PointsDisplay";

export function Header() {
  const { isAuthenticated, login } = useAuth();
  
  return (
    <header className="border-b bg-white p-4 sticky top-0 z-10">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-accent">
            <span className="text-primary">Us</span>Mode
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <PointsDisplay />
          
          {!isAuthenticated && (
            <Button variant="outline" size="sm" onClick={login} className="border-accent text-accent hover:bg-accent/5">
              <LogIn className="h-4 w-4 mr-1" />
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
