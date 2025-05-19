
import { PointsDisplay } from "./PointsDisplay";
import { ProfileSettings } from "./ProfileSettings";
import { useAuth } from "@/contexts/AuthContext";
import { PairPrompt } from "./PairPrompt";
import { PairedUserBanner } from "./PairedUserBanner";
import { InviteHandler } from "./InviteHandler";
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
            <PointsDisplay />
            <NotificationCenter />
            <ProfileSettings />
          </>
        )}
        <PairPrompt />
        <PairedUserBanner />
        <InviteHandler />
      </div>
    </header>
  );
}
