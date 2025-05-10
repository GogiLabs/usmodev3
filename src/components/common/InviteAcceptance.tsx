import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function InviteAcceptance() {
  const [searchParams] = useSearchParams();
  const inviteId = searchParams.get("invite_id");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAuthenticated, login } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'checking' | 'valid' | 'invalid' | 'accepted' | 'expired'>('checking');
  const [inviteData, setInviteData] = useState<{
    sender_email?: string;
    sender_name?: string;
    pair_id?: string;
  } | null>(null);

  // Check invite validity
  useEffect(() => {
    const checkInvite = async () => {
      if (!inviteId) {
        setStatus('invalid');
        return;
      }

      try {
        setLoading(true);
        
        // Get invite details
        const { data: invite, error: inviteError } = await supabase
          .from('invites')
          .select(`
            id, 
            status, 
            pair_id, 
            expires_at, 
            sender_id, 
            profiles:sender_id (
              id, 
              display_name,
              email
            )
          `)
          .eq('id', inviteId)
          .single();
          
        if (inviteError || !invite) {
          console.error("Error fetching invite:", inviteError);
          setStatus('invalid');
          return;
        }
        
        // Check if invite is expired
        if (invite.status === 'expired' || new Date(invite.expires_at) < new Date()) {
          setStatus('expired');
          return;
        }
        
        // Check if invite is already accepted
        if (invite.status === 'accepted') {
          setStatus('accepted');
          return;
        }
        
        // Invite is valid
        setStatus('valid');
        
        // Extract sender info - fixed the email property access
        const senderEmail = invite.profiles?.email;
        const senderName = invite.profiles?.display_name || senderEmail?.split('@')[0] || 'Someone';
        
        setInviteData({
          sender_email: senderEmail,
          sender_name: senderName,
          pair_id: invite.pair_id
        });
        
      } catch (error) {
        console.error("Error checking invite:", error);
        setStatus('invalid');
      } finally {
        setLoading(false);
      }
    };

    checkInvite();
  }, [inviteId]);

  // Accept the invitation
  const acceptInvite = async () => {
    if (!isAuthenticated || !user || !inviteId || !inviteData?.pair_id) {
      toast({
        title: "Error",
        description: "You must be logged in to accept this invitation.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Check if user is already in a pair
      const { data: existingPair } = await supabase
        .from('pairs')
        .select('id')
        .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`)
        .single();
      
      if (existingPair && existingPair.id !== inviteData.pair_id) {
        toast({
          title: "Already paired",
          description: "You are already paired with someone else.",
          variant: "destructive",
        });
        return;
      }
      
      // Begin transaction to update pair and invitation status
      const { error: updateError } = await supabase
        .from('pairs')
        .update({ user_2_id: user.id })
        .eq('id', inviteData.pair_id);
      
      if (updateError) {
        throw updateError;
      }
      
      // Mark invitation as accepted
      const { error: inviteError } = await supabase
        .from('invites')
        .update({ status: 'accepted' })
        .eq('id', inviteId);
      
      if (inviteError) {
        throw inviteError;
      }
      
      // Success!
      toast({
        title: "Invitation accepted!",
        description: `You are now connected with ${inviteData.sender_name}.`,
      });
      
      setStatus('accepted');
      
      // Navigate to the dashboard after a brief delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (error: any) {
      console.error("Error accepting invite:", error);
      toast({
        title: "Failed to accept invitation",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // If no invite ID is provided
  if (!inviteId) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Invalid Invitation</CardTitle>
          <CardDescription>No invitation ID was provided.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => navigate('/')} variant="outline" className="w-full">
            Return Home
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // UI for different states
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          {status === 'checking' && "Checking Invitation"}
          {status === 'valid' && "Join Your Partner"}
          {status === 'invalid' && "Invalid Invitation"}
          {status === 'expired' && "Expired Invitation"}
          {status === 'accepted' && "Invitation Accepted"}
        </CardTitle>
        <CardDescription>
          {status === 'checking' && "Please wait while we verify your invitation..."}
          {status === 'valid' && inviteData?.sender_name && `${inviteData.sender_name} has invited you to collaborate`}
          {status === 'invalid' && "This invitation link is invalid or cannot be found"}
          {status === 'expired' && "This invitation has expired"}
          {status === 'accepted' && "You've successfully connected with your partner!"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="text-center">
        {status === 'checking' && <div className="animate-pulse">Loading...</div>}
        
        {status === 'valid' && (
          <div className="flex flex-col items-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <p>Ready to connect and start using UsMode together!</p>
          </div>
        )}
        
        {status === 'invalid' && (
          <div className="flex flex-col items-center space-y-4">
            <XCircle className="h-16 w-16 text-red-500" />
            <p>The invitation link you followed is not valid.</p>
          </div>
        )}
        
        {status === 'expired' && (
          <div className="flex flex-col items-center space-y-4">
            <AlertCircle className="h-16 w-16 text-amber-500" />
            <p>This invitation has expired. Please ask for a new invitation.</p>
          </div>
        )}
        
        {status === 'accepted' && (
          <div className="flex flex-col items-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <p>Connection successful! Redirecting to your dashboard...</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-2">
        {status === 'valid' && (
          <>
            {!isAuthenticated ? (
              <>
                <Button 
                  onClick={() => navigate(`/auth?invite_id=${inviteId}`)} 
                  className="w-full"
                >
                  Sign in to accept
                </Button>
                <p className="text-sm text-muted-foreground">
                  You'll need to sign in or create an account to accept this invitation.
                </p>
              </>
            ) : (
              <Button 
                onClick={acceptInvite} 
                className="w-full" 
                disabled={loading}
              >
                {loading ? "Processing..." : "Accept Invitation"}
              </Button>
            )}
          </>
        )}
        
        {(status === 'invalid' || status === 'expired') && (
          <Button onClick={() => navigate('/')} variant="outline" className="w-full">
            Return Home
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
