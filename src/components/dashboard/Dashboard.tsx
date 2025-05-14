
import { useState } from "react";
import { TaskList } from "@/components/tasks/TaskList";
import { RewardList } from "@/components/rewards/RewardList";
import { PairedUserBanner } from "@/components/common/PairedUserBanner";
import { PairPrompt } from "@/components/common/PairPrompt";
import { AuthRequiredBanner } from "@/components/common/AuthRequiredBanner";
import { EmptyStateBanner } from "@/components/dashboard/EmptyStateBanner";
import { PointsDisplay } from "@/components/common/PointsDisplay";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/common/Header";
import { useAuth } from "@/contexts/AuthContext";
import { usePairStatus } from "@/hooks/use-pair-status";
import { useTasks } from "@/hooks/use-tasks";
import { useRewards } from "@/hooks/use-rewards";

export function Dashboard() {
  const { isAuthenticated, user } = useAuth();
  const { isPaired, pairData, loading: pairLoading } = usePairStatus();
  const { tasks, loading: tasksLoading } = useTasks();
  const { rewards, loading: rewardsLoading } = useRewards();
  const [activeTab, setActiveTab] = useState<"tasks" | "rewards">("tasks");
  
  // Show authentication banner if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="h-full flex flex-col">
        <Header />
        <div className="flex-1 p-4">
          <AuthRequiredBanner />
        </div>
      </div>
    );
  }

  const hasContent = (tasks && tasks.length > 0) || (rewards && rewards.length > 0);
  
  return (
    <div className="h-full flex flex-col">
      <Header />
      
      <div className="flex-1 p-4 flex flex-col space-y-4 overflow-auto pb-20">
        {isPaired && pairData ? (
          <PairedUserBanner />
        ) : (
          <PairPrompt className="mt-1" />
        )}
        
        <PointsDisplay className="mt-2" />
        
        {/* Tab Navigation */}
        <div className="flex border-b">
          <Button
            variant={activeTab === "tasks" ? "default" : "ghost"}
            className={`flex-1 rounded-none rounded-t-lg ${activeTab === "tasks" ? "bg-primary text-primary-foreground" : ""}`}
            onClick={() => setActiveTab("tasks")}
          >
            Tasks
          </Button>
          <Button
            variant={activeTab === "rewards" ? "default" : "ghost"}
            className={`flex-1 rounded-none rounded-t-lg ${activeTab === "rewards" ? "bg-primary text-primary-foreground" : ""}`}
            onClick={() => setActiveTab("rewards")}
          >
            Rewards
          </Button>
        </div>
        
        {/* Show empty state only when there's no content and not loading */}
        {!hasContent && !tasksLoading && !rewardsLoading && (
          <EmptyStateBanner type={activeTab} />
        )}
        
        {/* Conditional rendering based on active tab */}
        {activeTab === "tasks" ? (
          <TaskList />
        ) : (
          <RewardList />
        )}
      </div>
    </div>
  );
}
