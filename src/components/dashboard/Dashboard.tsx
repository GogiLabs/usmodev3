
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCog, ArrowRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ProfileSettings } from "@/components/common/ProfileSettings";
import { PointsDisplay } from "@/components/common/PointsDisplay";
import { PointsHistoryDialog } from "@/components/common/PointsHistoryDialog";
import { useAuth } from "@/contexts/AuthContext";
import { TaskList } from "@/components/tasks/TaskList";
import { RewardList } from "@/components/rewards/RewardList";
import { AuthRequiredBanner } from "@/components/common/AuthRequiredBanner";
import { InviteHandler } from "@/components/common/InviteHandler";
import { PairedUserBanner } from "@/components/common/PairedUserBanner";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePairDetails } from "@/hooks/use-supabase-data";
import { PairPrompt } from "@/components/common/PairPrompt";
import { EmptyStateBanner } from "@/components/dashboard/EmptyStateBanner";
import { motion, AnimatePresence } from "framer-motion";

export function Dashboard() {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState("tasks");
  const isMobile = useIsMobile();
  const { data: pairDetails, isLoading: pairLoading } = usePairDetails();
  
  // Determine if user is paired
  const isPaired = pairDetails?.user_1_id && pairDetails?.user_2_id;
  
  // Handle the guest-to-auth transition
  useEffect(() => {
    // If the user just logged in and was using local state, we can
    // handle the transition here once they get paired
    if (isAuthenticated && isPaired) {
      // Future implementation: Migrate local tasks to Supabase if needed
    }
  }, [isAuthenticated, isPaired]);
  
  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track your tasks and rewards together
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          {isAuthenticated && isPaired && <PairedUserBanner />}
          <div className="flex items-center gap-2">
            {isAuthenticated && !isPaired && !isMobile && <InviteHandler />}
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
      
      {!isAuthenticated && <AuthRequiredBanner />}
      
      {/* Show pair prompt for authenticated but unpaired users */}
      {isAuthenticated && !isPaired && !pairLoading && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <PairPrompt />
          </motion.div>
        </AnimatePresence>
      )}
      
      {/* Show EmptyStateBanner for unauthenticated users */}
      {!isAuthenticated && (
        <EmptyStateBanner />
      )}
      
      {/* Show the compact invite handler for mobile */}
      {isAuthenticated && !isPaired && isMobile && (
        <div className="mb-4 flex justify-center">
          <PairPrompt compact />
        </div>
      )}
      
      <div className="flex items-center justify-center mb-4">
        <PointsDisplay />
      </div>
      
      {(isPaired || !isAuthenticated) && (
        <div className="mx-auto max-w-sm">
          <PointsHistoryDialog />
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="tasks" className="flex-1">Tasks</TabsTrigger>
          <TabsTrigger value="rewards" className="flex-1">Rewards</TabsTrigger>
        </TabsList>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: activeTab === 'tasks' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTab === 'tasks' ? 20 : -20 }}
            transition={{ duration: 0.3 }}
          >
            <TabsContent value="tasks" className="bg-card rounded-lg border border-border shadow-sm">
              <ErrorBoundary>
                {isAuthenticated && !isPaired ? (
                  <div className="p-8 text-center">
                    <div className="flex flex-col items-center justify-center p-8">
                      <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Connect with Your Partner</h3>
                      <p className="text-muted-foreground mb-6">
                        Invite your partner to start tracking tasks and rewards together.
                      </p>
                      <InviteHandler />
                    </div>
                  </div>
                ) : (
                  <TaskList />
                )}
              </ErrorBoundary>
            </TabsContent>
            
            <TabsContent value="rewards" className="bg-card rounded-lg border border-border shadow-sm">
              <ErrorBoundary>
                {isAuthenticated && !isPaired ? (
                  <div className="p-8 text-center">
                    <div className="flex flex-col items-center justify-center p-8">
                      <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Connect with Your Partner</h3>
                      <p className="text-muted-foreground mb-6">
                        Invite your partner to start tracking tasks and rewards together.
                      </p>
                      <InviteHandler />
                    </div>
                  </div>
                ) : (
                  <RewardList />
                )}
              </ErrorBoundary>
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
