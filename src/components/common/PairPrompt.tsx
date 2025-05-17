
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InviteHandler } from "@/components/common/InviteHandler";
import { UsersRound, Mail, Info, Clock, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useInvites } from "@/hooks/use-supabase-data";
import { useAuth } from "@/contexts/AuthContext";

interface PairPromptProps {
  className?: string;
  compact?: boolean;
}

export function PairPrompt({ className, compact = false }: PairPromptProps) {
  const [showInfo, setShowInfo] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: invites, isLoading: invitesLoading, refetch: refetchInvites } = useInvites();
  
  // Check if there's a pending invite
  const pendingInvite = invites && invites.length > 0 
    ? invites.find(invite => invite.status === 'pending')
    : null;
  
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

  const handleRefreshInvites = () => {
    refetchInvites();
    toast({
      title: "Refreshed",
      description: "Invitation status updated",
    });
  };

  // Render the pending invite card
  const renderPendingInviteCard = () => (
    <Card className="bg-gradient-to-r from-amber-50 to-orange-50 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="text-amber-500 mr-2 h-5 w-5" />
          Invitation Pending
        </CardTitle>
        <CardDescription>
          Waiting for your partner to accept the invitation
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="bg-white/50 p-3 rounded-md mb-4">
          <p className="text-sm mb-2">
            <strong>Invitation sent to:</strong>
          </p>
          <div className="flex items-center gap-2 p-2 bg-white rounded border border-amber-200">
            <Mail className="h-4 w-4 text-amber-500" />
            <span className="font-medium text-sm">{pendingInvite?.recipient_email}</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button 
            variant="outline" 
            className="w-full sm:w-auto"
            onClick={handleRefreshInvites}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
          
          <Button 
            variant="secondary" 
            className="w-full sm:w-auto"
            onClick={() => {
              setShowInfo(!showInfo);
            }}
          >
            <Info className="h-4 w-4 mr-2" />
            {showInfo ? "Hide Details" : "Show Details"}
          </Button>
        </div>
        
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: showInfo ? 'auto' : 0, opacity: showInfo ? 1 : 0 }}
          className="overflow-hidden mt-4"
        >
          <div className="space-y-2 bg-white/70 p-3 rounded-md">
            <p className="text-sm">
              <strong>What happens next?</strong>
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              <li>Your partner will receive an email with your invitation</li>
              <li>Once they accept, you'll be paired automatically</li>
              <li>Invites expire after 7 days if not accepted</li>
              <li>You can send a new invitation if needed</li>
            </ul>
          </div>
        </motion.div>
      </CardContent>
      
      <CardFooter>
        <div className="text-sm text-muted-foreground text-center w-full">
          Need to invite someone else? <Button variant="link" className="h-auto p-0" onClick={() => navigate("/invite")}>Manage invitations</Button>
        </div>
      </CardFooter>
    </Card>
  );

  // Render the compact pending invite
  const renderCompactPendingInvite = () => (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3 animate-fade-in flex items-center justify-between">
      <div className="flex items-center">
        <Clock className="text-amber-500 mr-2 h-5 w-5" />
        <span className="font-medium text-sm">Invitation pending</span>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="p-1 h-8 w-8" 
          onClick={handleRefreshInvites}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 px-3"
          onClick={() => navigate("/invite")}
        >
          <Mail className="h-4 w-4 mr-1" />
          <span className="text-xs">{pendingInvite?.recipient_email.split('@')[0]}</span>
        </Button>
      </div>
    </div>
  );

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {invitesLoading ? (
        // Loading state
        <div className="bg-gray-100 rounded-lg p-4 animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      ) : compact ? (
        // Compact mode
        pendingInvite ? renderCompactPendingInvite() : (
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
        )
      ) : (
        // Full mode
        pendingInvite ? renderPendingInviteCard() : (
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
        )
      )}
    </motion.div>
  );
}
