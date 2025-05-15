
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
  
  // If there's an invite ID in the URL, redirect to the invite page
  useEffect(() => {
    if (inviteId) {
      console.log("🔄 Redirecting to invite page with ID:", inviteId);
      
      // Set the invite context before redirecting
      const setContext = async () => {
        try {
          await supabase.rpc('set_invite_context' as any, { invite_id: inviteId });
          console.log("✅ Set invite context before redirect");
        } catch (error) {
          console.error("❌ Failed to set invite context before redirect:", error);
        }
        // Redirect regardless of context setting success
        navigate(`/invite?invite_id=${inviteId}`);
      };
      
      setContext();
    }
  }, [inviteId, navigate]);
  
  return (
    <Dashboard />
  );
};

export default Index;
