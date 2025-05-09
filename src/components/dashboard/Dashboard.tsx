
import { useState, useEffect } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { TaskList } from "@/components/tasks/TaskList";
import { RewardList } from "@/components/rewards/RewardList";
import { Header } from "@/components/common/Header";
import { useAuth } from "@/contexts/AuthContext";
import { AuthRequiredBanner } from "@/components/common/AuthRequiredBanner";
import { useIsMobile } from "@/hooks/use-mobile";

export function Dashboard() {
  const { isAuthenticated } = useAuth();
  const [taskPanelSize, setTaskPanelSize] = useState(50);
  const [rewardPanelSize, setRewardPanelSize] = useState(50);
  const isMobile = useIsMobile();
  
  // On mobile devices, stack the panels vertically with different default sizes
  const [orientation, setOrientation] = useState<"vertical" | "horizontal">("vertical");
  
  useEffect(() => {
    // On mobile, use a different split ratio (tasks get more space)
    if (isMobile) {
      setTaskPanelSize(60);
      setRewardPanelSize(40);
      setOrientation("vertical");
    } else {
      setTaskPanelSize(50);
      setRewardPanelSize(50);
      setOrientation("vertical");
    }
  }, [isMobile]);

  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup
          direction={orientation}
          className="min-h-[calc(100vh-64px)]"
        >
          <ResizablePanel
            defaultSize={isMobile ? 60 : 50}
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
            defaultSize={isMobile ? 40 : 50}
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
