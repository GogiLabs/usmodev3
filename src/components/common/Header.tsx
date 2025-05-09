
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { PointsDisplay } from "./PointsDisplay";
import { useIsMobile } from "@/hooks/use-mobile";

export function Header() {
  const { isAuthenticated, login } = useAuth();
  const isMobile = useIsMobile();
  
  return (
    <header className="border-b bg-white p-3 sm:p-4 sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto flex flex-col sm:flex-row items-center gap-2 sm:gap-0 sm:justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-accent">
            <span className="text-primary">Us</span>Mode
          </h1>
        </div>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <PointsDisplay className={isMobile ? "flex-1 text-xs" : ""} />
          
          {!isAuthenticated && !isMobile && (
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
