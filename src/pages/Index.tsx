
import { Dashboard } from "@/components/dashboard/Dashboard";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { isAuthenticated } = useAuth();
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
        localStorage.removeItem("pending_invite_id");
      }
    }
  }, [inviteId, isAuthenticated, navigate]);
  
  return (
    <Dashboard />
  );
};

export default Index;
