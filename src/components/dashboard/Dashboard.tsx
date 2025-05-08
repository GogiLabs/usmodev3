
import { useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { TaskList } from "@/components/tasks/TaskList";
import { RewardList } from "@/components/rewards/RewardList";
import { Header } from "@/components/common/Header";
import { useAuth } from "@/contexts/AuthContext";
import { AuthRequiredBanner } from "@/components/common/AuthRequiredBanner";

export function Dashboard() {
  const { isAuthenticated } = useAuth();
  const [taskPanelSize, setTaskPanelSize] = useState(50);
  const [rewardPanelSize, setRewardPanelSize] = useState(50);

  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup
          direction="vertical"
          className="min-h-[calc(100vh-64px)]"
        >
          <ResizablePanel
            defaultSize={50}
            minSize={20}
            onResize={(size) => {
              setTaskPanelSize(size);
              setRewardPanelSize(100 - size);
            }}
          >
            <div className="h-full bg-background p-0">
              <TaskList />
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel 
            defaultSize={50}
            minSize={20}
            onResize={(size) => {
              setRewardPanelSize(size);
              setTaskPanelSize(100 - size);
            }}
          >
            <div className="h-full bg-background p-0">
              <RewardList />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      
      {!isAuthenticated && <AuthRequiredBanner />}
    </div>
  );
}
