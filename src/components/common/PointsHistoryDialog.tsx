
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTask } from "@/contexts/task/TaskContext";
import { useReward } from "@/contexts/reward/RewardContext";
import { format, isToday, isYesterday } from "date-fns";
import { Award, CheckCircle, ShoppingBag } from "lucide-react";
import { Task } from "@/types/Task";
import { Reward } from "@/types/Reward";
import { LoadingSpinner } from "./LoadingSpinner";
import { usePairDetails } from "@/hooks/use-supabase-data";

export function PointsHistoryDialog() {
  const [open, setOpen] = useState(false);
  const { tasks, loadingTasks } = useTask();
  const { rewards, loadingRewards } = useReward();
  const { data: pairDetails } = usePairDetails();
  
  const formatDate = (date: Date) => {
    if (isToday(date)) {
      return `Today, ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday, ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };
  
  const getCompletedBy = (userId?: string) => {
    if (!userId || !pairDetails) return "Unknown";
    
    if (userId === pairDetails.user_1_id) {
      return pairDetails.user_1_name || "Partner 1";
    } else if (userId === pairDetails.user_2_id) {
      return pairDetails.user_2_name || "Partner 2";
    }
    
    return "Unknown";
  };
  
  // Filter completed tasks and sort by completion date
  const completedTasks = tasks
    .filter((task): task is Task & { completedAt: Date } => 
      task.completed && !!task.completedAt
    )
    .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  
  // Filter claimed rewards and sort by claim date
  const claimedRewards = rewards
    .filter((reward): reward is Reward & { claimedAt: Date } => 
      reward.claimed && !!reward.claimedAt
    )
    .sort((a, b) => b.claimedAt.getTime() - a.claimedAt.getTime());
    
  const loading = loadingTasks || loadingRewards;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          View Points History
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Points History</DialogTitle>
          <DialogDescription>
            See how you've earned and spent your points
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="earned" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="earned">Earned</TabsTrigger>
            <TabsTrigger value="spent">Spent</TabsTrigger>
          </TabsList>
          
          <TabsContent value="earned">
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner text="Loading completed tasks..." />
              </div>
            ) : completedTasks.length > 0 ? (
              <ScrollArea className="h-[300px] rounded-md border p-2">
                <div className="space-y-3">
                  {completedTasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-2 border-b pb-2 last:border-b-0">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{task.description}</p>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{formatDate(task.completedAt)}</span>
                          {task.completedBy && (
                            <span>by {getCompletedBy(task.completedBy)}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-green-600 font-semibold">+{task.points}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p>No completed tasks yet</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="spent">
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner text="Loading claimed rewards..." />
              </div>
            ) : claimedRewards.length > 0 ? (
              <ScrollArea className="h-[300px] rounded-md border p-2">
                <div className="space-y-3">
                  {claimedRewards.map((reward) => (
                    <div key={reward.id} className="flex items-start gap-2 border-b pb-2 last:border-b-0">
                      <ShoppingBag className="h-5 w-5 text-amber-500 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{reward.description}</p>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{formatDate(reward.claimedAt)}</span>
                          {reward.claimedBy && (
                            <span>by {getCompletedBy(reward.claimedBy)}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-red-600 font-semibold">-{reward.pointCost}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingBag className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p>No claimed rewards yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
