
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InviteHandler } from "@/components/common/InviteHandler";
import { UsersRound, Mail, Info } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

interface PairPromptProps {
  className?: string;
  compact?: boolean;
}

export function PairPrompt({ className, compact = false }: PairPromptProps) {
  const [showInfo, setShowInfo] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleInfoClick = () => {
    if (compact) {
      toast({
        title: "Pairing Information",
        description: "Pair with your partner to sync tasks and rewards across devices. Share an invite link to get started.",
      });
    } else {
      setShowInfo(!showInfo);
    }
  };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {compact ? (
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-3 animate-fade-in flex items-center justify-between">
          <div className="flex items-center">
            <UsersRound className="text-pink-500 mr-2 h-5 w-5" />
            <span className="font-medium text-sm">Not paired yet</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 h-8 w-8" 
              onClick={handleInfoClick}
            >
              <Info className="h-4 w-4" />
            </Button>
            <InviteHandler compact />
          </div>
        </div>
      ) : (
        <Card className="bg-gradient-to-r from-pink-50 to-purple-50 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <UsersRound className="text-pink-500 mr-2 h-5 w-5" />
              Complete Your Setup
            </CardTitle>
            <CardDescription>
              Connect with your partner to get the most out of UsMode
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: showInfo ? 'auto' : 0, opacity: showInfo ? 1 : 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="space-y-2 bg-white/50 p-3 rounded-md">
                <p className="text-sm">
                  <strong>Why pair?</strong> When you connect with your partner, you can:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                  <li>Share and sync tasks across devices</li>
                  <li>Track rewards and points together</li>
                  <li>Get real-time updates on completed tasks</li>
                  <li>Collaborate on your relationship goals</li>
                </ul>
              </div>
            </motion.div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button 
                variant="outline" 
                className="w-full sm:w-auto flex-1"
                onClick={handleInfoClick}
              >
                {showInfo ? "Hide Details" : "Why Pair?"}
              </Button>
              
              <div className="w-full sm:w-auto flex-1">
                <InviteHandler />
              </div>
            </div>
          </CardContent>
          
          <CardFooter>
            <div className="text-sm text-muted-foreground text-center w-full">
              Already have an invite? Check your email or ask your partner to invite you.
            </div>
          </CardFooter>
        </Card>
      )}
    </motion.div>
  );
}
