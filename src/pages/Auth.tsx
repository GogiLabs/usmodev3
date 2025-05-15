import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const Auth = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteId = searchParams.get("invite_id");
  const [activeTab, setActiveTab] = useState<string>("login");
  const [pendingInviteId, setPendingInviteId] = useState<string | null>(null);

  useEffect(() => {
    // Check for pending invite in localStorage or URL params
    const storedInviteId = localStorage.getItem("pending_invite_id");
    const effectiveInviteId = inviteId || storedInviteId;
    
    if (effectiveInviteId) {
      console.log("📌 Found pending invite ID:", effectiveInviteId);
      setPendingInviteId(effectiveInviteId);
      
      // If there's an invite ID, default to the signup tab for new users
      setActiveTab("signup");
    }
  }, [inviteId]);
  
  // Handle authenticated state
  useEffect(() => {
    if (isAuthenticated) {
      // If there's a pending invite, navigate to the invite page
      if (pendingInviteId) {
        console.log("🔀 Redirecting to invite page with stored ID:", pendingInviteId);
        navigate(`/invite?invite_id=${pendingInviteId}`);
      } else {
        // Otherwise go to home
        navigate("/");
      }
    }
  }, [isAuthenticated, pendingInviteId, navigate]);

  // If already authenticated, the above useEffect will handle navigation
  if (isAuthenticated) {
    return null; // Render nothing while redirecting
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-pink-50 to-purple-50 p-4">
      <AuthHeader inviteId={pendingInviteId} />

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-xl">
            {pendingInviteId ? "Accept Invitation" : "Welcome"}
          </CardTitle>
          <CardDescription className="text-center">
            {pendingInviteId
              ? "Sign in or create an account to connect with your partner"
              : "Sign in to your account or create a new one"}
          </CardDescription>
        </CardHeader>
        
        {pendingInviteId && (
          <div className="px-6">
            <Alert className="mb-4 bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600 mr-2" />
              <AlertDescription className="text-blue-700">
                Authentication is required to view and accept this invitation.
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <LoginForm />
            </TabsContent>

            <TabsContent value="signup">
              <SignupForm onSuccess={() => setActiveTab("login")} />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col border-t px-6 py-4 text-center text-sm text-muted-foreground">
          <p>
            By continuing, you agree to UsMode's Terms of Service and Privacy Policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
