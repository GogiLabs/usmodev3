
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ProfileSettings } from "@/components/common/ProfileSettings";
import { PointsDisplay } from "@/components/common/PointsDisplay";
import { useAuth } from "@/contexts/AuthContext";
import { TaskList } from "@/components/tasks/TaskList";
import { RewardList } from "@/components/rewards/RewardList";
import { AuthRequiredBanner } from "@/components/common/AuthRequiredBanner";
import { InviteHandler } from "@/components/common/InviteHandler";
import { PairedUserBanner } from "@/components/common/PairedUserBanner";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { useMobileView } from "@/hooks/use-mobile";

export function Dashboard() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("tasks");
  const isMobile = useMobileView();
  
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="container max-w-5xl px-4 pt-6 pb-20 flex-1">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Track your tasks and rewards together
            </p>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            {isAuthenticated && <PairedUserBanner />}
            <div className="flex items-center gap-2">
              {isAuthenticated && !isMobile && <InviteHandler />}
              <PointsDisplay />
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <UserCog className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <ProfileSettings />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
        
        {!isAuthenticated && <AuthRequiredBanner className="mb-6" />}
        
        {isAuthenticated && isMobile && (
          <div className="mb-4 flex justify-center">
            <InviteHandler />
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="tasks" className="flex-1">Tasks</TabsTrigger>
            <TabsTrigger value="rewards" className="flex-1">Rewards</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tasks" className="bg-card rounded-lg border border-border shadow-sm">
            <ErrorBoundary>
              <TaskList />
            </ErrorBoundary>
          </TabsContent>
          
          <TabsContent value="rewards" className="bg-card rounded-lg border border-border shadow-sm">
            <ErrorBoundary>
              <RewardList />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
