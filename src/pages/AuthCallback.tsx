
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { error } = await supabase.auth.getSession();
      
      if (error) {
        toast({
          title: "Authentication Error",
          description: error.message,
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }
      
      toast({
        title: "Authentication Successful",
        description: "You are now logged in.",
      });

      // Check if there was a stored return URL (for handling invites)
      const returnUrl = localStorage.getItem('auth_return_url');
      if (returnUrl) {
        localStorage.removeItem('auth_return_url');
        navigate(returnUrl);
      } else {
        navigate('/');
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <h1 className="text-2xl font-bold mt-4">Completing authentication...</h1>
        <p className="text-muted-foreground">Please wait while we log you in.</p>
      </div>
    </div>
  );
};

export default AuthCallback;
