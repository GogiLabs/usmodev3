
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User } from "lucide-react";
import { PointsDisplay } from "./PointsDisplay";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from "react-router-dom";
import { ProfileSettings } from "./ProfileSettings";
import { InviteHandler } from "./InviteHandler";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { isAuthenticated, logout, user } = useAuth();
  const isMobile = useIsMobile();
  
  return (
    <header className="border-b bg-white p-3 sm:p-4 sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto flex flex-col sm:flex-row items-center gap-2 sm:gap-0 sm:justify-between">
        <div className="flex items-center">
          <Link to="/" className="text-xl font-semibold text-accent no-underline">
            <span className="text-primary">Us</span>Mode
          </Link>
        </div>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <PointsDisplay className={isMobile ? "flex-1 text-xs" : ""} />
          
          {!isAuthenticated ? (
            <Button 
              variant="outline" 
              size="sm" 
              asChild
              className="border-accent text-accent hover:bg-accent/5"
            >
              <Link to="/auth">
                <LogIn className="h-4 w-4 mr-1" />
                Sign In
              </Link>
            </Button>
          ) : (
            <>
              <InviteHandler />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-accent text-accent hover:bg-accent/5">
                    <User className="h-4 w-4 mr-1" />
                    {user?.email?.split('@')[0]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ProfileSettings />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
