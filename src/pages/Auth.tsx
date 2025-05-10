
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import { AuthHeader } from "@/components/auth/AuthHeader";

const Auth = () => {
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const inviteId = searchParams.get("invite_id");
  const [activeTab, setActiveTab] = useState<string>("login");

  useEffect(() => {
    // If there's an invite ID, default to the signup tab for new users
    if (inviteId) {
      setActiveTab("signup");
    }
  }, [inviteId]);

  if (isAuthenticated && !inviteId) {
    return <Navigate to="/" />;
  }

  if (isAuthenticated && inviteId) {
    return <Navigate to={`/invite?invite_id=${inviteId}`} />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-pink-50 to-purple-50 p-4">
      <AuthHeader inviteId={inviteId} />

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-xl">
            {inviteId ? "Accept Invitation" : "Welcome"}
          </CardTitle>
          <CardDescription className="text-center">
            {inviteId
              ? "Sign in or create an account to connect with your partner"
              : "Sign in to your account or create a new one"}
          </CardDescription>
        </CardHeader>
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
