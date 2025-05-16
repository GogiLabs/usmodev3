
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast-wrapper";

export function useInviteContext() {
  const [contextSetAttempts, setContextSetAttempts] = useState(0);
  
  const setInviteContextWithRetry = useCallback(async (inviteId: string) => {
    console.log("🔄 Attempting to set invite context");
    try {
      // Try up to 3 times with backoff
      for (let i = 0; i < 3; i++) {
        try {
          setContextSetAttempts(prev => prev + 1);
          console.log(`🔄 Context init attempt ${i+1} for invite:`, inviteId);
          await supabase.rpc('set_invite_context' as any, { invite_id: inviteId });
          console.log("✅ Invite context set successfully");
          return true;
        } catch (retryError) {
          console.warn(`⚠️ Context init attempt ${i+1} failed:`, retryError);
          if (i < 2) {
            // Wait briefly before retry
            await new Promise(resolve => setTimeout(resolve, 200 * (i + 1)));
          }
        }
      }
      throw new Error("Failed to set invite context after multiple attempts");
    } catch (error) {
      console.error("❌ Failed to initialize invite context:", error);
      toast({
        title: "Connection issue",
        description: "There was a problem connecting to the server. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  }, []);
  
  return {
    setInviteContext: setInviteContextWithRetry,
    contextSetAttempts
  };
}
