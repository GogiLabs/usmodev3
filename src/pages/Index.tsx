
import { Dashboard } from "@/components/dashboard/Dashboard";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteId = searchParams.get("invite_id") || searchParams.get("inviteId");
  
  // Handle invite IDs, whether we're authenticated or not
  useEffect(() => {
    if (inviteId) {
      console.log("🔄 Found invite ID in URL:", inviteId);
      
      // If we're not authenticated, store the invite ID for later
      if (!isAuthenticated) {
        console.log("💾 Storing pending invite ID for post-authentication");
        localStorage.setItem("pending_invite_id", inviteId);
      }
      
      // Always redirect to the invite page
      console.log("🔀 Redirecting to invite page");
      navigate(`/invite?invite_id=${inviteId}`);
    } else {
      // Check if there's a pending invite ID from a previous visit
      const pendingInviteId = localStorage.getItem("pending_invite_id");
      
      if (pendingInviteId && isAuthenticated) {
        console.log("🔄 Found pending invite ID in storage:", pendingInviteId);
        console.log("🔀 Redirecting to invite page with stored ID");
        navigate(`/invite?invite_id=${pendingInviteId}`);
      }
    }
  }, [inviteId, isAuthenticated, navigate]);
  
  // Force refresh pair data when landing on the index page after authentication
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const refreshPairData = async () => {
        console.log("🔄 Forcing refresh of pair data for user:", user.id);
        
        try {
          // First check if the user is in a pair
          const { data: pairData } = await supabase
            .from('pairs')
            .select('id')
            .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`)
            .maybeSingle();
            
          console.log("🔍 Current pair data:", pairData);
          
          if (pairData?.id) {
            // If we found a pair, try to refresh the pair details view using the edge function
            console.log("🔄 Refreshing pair details for pair:", pairData.id);
            try {
              // Use the edge function to refresh pair details
              const { data, error } = await supabase.functions.invoke('refresh-pair-details', {
                body: { pairId: pairData.id, userId: user.id }
              });
              
              if (error) {
                console.warn("⚠️ Error refreshing pair details via edge function:", error);
              } else {
                console.log("✅ Successfully refreshed pair details:", data);
              }
            } catch (e) {
              console.error("❌ Error refreshing pair details:", e);
              
              // Fallback: try direct fetch
              await supabase
                .from('pair_details')
                .select('*')
                .or(`user_1_id.eq.${user.id},user_2_id.eq.${user.id}`)
                .limit(1);
                
              console.log("🔄 Attempted direct refresh of pair details");
            }
          }
        } catch (error) {
          console.error("❌ Error during pair refresh:", error);
        }
      };
      
      refreshPairData();
    }
  }, [isAuthenticated, user?.id]);
  
  return (
    <Dashboard />
  );
};

export default Index;
