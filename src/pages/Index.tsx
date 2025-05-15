
import { Dashboard } from "@/components/dashboard/Dashboard";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const Index = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteId = searchParams.get("invite_id") || searchParams.get("inviteId");
  
  // If there's an invite ID in the URL, redirect to the invite page
  useEffect(() => {
    if (inviteId) {
      console.log("🔄 Redirecting to invite page with ID:", inviteId);
      navigate(`/invite?invite_id=${inviteId}`);
    }
  }, [inviteId, navigate]);
  
  return (
    <Dashboard />
  );
};

export default Index;
