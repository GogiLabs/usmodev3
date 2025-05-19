
import { ProfileSettings } from "./ProfileSettings";
import { useAuth } from "@/contexts/AuthContext";
import { NetworkStatusIndicator } from "./NetworkStatusIndicator";
import { NotificationCenter } from "./NotificationCenter";

export function Header() {
  const { isAuthenticated } = useAuth();
  
  return (
    <header className="bg-white border-b py-3 px-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-primary">Paired Tasks</span>
        <NetworkStatusIndicator />
      </div>
      
      <div className="flex items-center gap-3">
        {isAuthenticated && (
          <>
            <NotificationCenter />
            <ProfileSettings />
          </>
        )}
        
      </div>
    </header>
  );
}
