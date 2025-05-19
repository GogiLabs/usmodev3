
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
import { format, isToday, isYesterday } from "date-fns";
import { Award, CheckCircle, ShoppingBag } from "lucide-react";
import { LoadingSpinner } from "./LoadingSpinner";
import { useUserPointsHistory, PointsHistoryItem } from "@/hooks/use-user-points-history";

export function PointsHistoryDialog() {
  const [open, setOpen] = useState(false);
  const { history, loading } = useUserPointsHistory();
  
  const formatDate = (date: string) => {
    const dateObj = new Date(date);
    if (isToday(dateObj)) {
      return `Today, ${format(dateObj, 'h:mm a')}`;
    } else if (isYesterday(dateObj)) {
      return `Yesterday, ${format(dateObj, 'h:mm a')}`;
    } else {
      return format(dateObj, 'MMM d, yyyy');
    }
  };
  
  // Filter points by source
  const taskPoints = history.filter(item => item.source_type === 'task');
  const rewardPoints = history.filter(item => item.source_type === 'reward');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          View Points History
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>My Points History</DialogTitle>
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
                <LoadingSpinner text="Loading points history..." />
              </div>
            ) : taskPoints.length > 0 ? (
              <ScrollArea className="h-[300px] rounded-md border p-2">
                <div className="space-y-3">
                  {taskPoints.map((item) => (
                    <div key={item.id} className="flex items-start gap-2 border-b pb-2 last:border-b-0">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.task?.description || "Task"}</p>
                        <div className="text-xs text-muted-foreground">
                          <span>{formatDate(item.created_at)}</span>
                        </div>
                      </div>
                      <span className="text-green-600 font-semibold">+{item.amount}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p>No points earned yet</p>
                <p className="text-xs mt-1">Complete tasks to earn points</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="spent">
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner text="Loading points history..." />
              </div>
            ) : rewardPoints.length > 0 ? (
              <ScrollArea className="h-[300px] rounded-md border p-2">
                <div className="space-y-3">
                  {rewardPoints.map((item) => (
                    <div key={item.id} className="flex items-start gap-2 border-b pb-2 last:border-b-0">
                      <ShoppingBag className="h-5 w-5 text-amber-500 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.reward?.description || "Reward"}</p>
                        <div className="text-xs text-muted-foreground">
                          <span>{formatDate(item.created_at)}</span>
                        </div>
                      </div>
                      <span className="text-red-600 font-semibold">{item.amount}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingBag className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p>No points spent yet</p>
                <p className="text-xs mt-1">Claim rewards to use your points</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
