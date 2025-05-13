
import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { toast as sonnerToast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';

export const useAuthMethods = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const login = async (email?: string, password?: string) => {
    try {
      setLoading(true);
      
      // If no credentials provided, navigate to auth page
      if (!email || !password) {
        navigate('/auth');
        return;
      }
      
      // Otherwise proceed with login
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }

      toast({
        title: "Logged in successfully",
        description: "Welcome back!",
      });
      
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error.message || "An error occurred during login.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            email_sender_name: "UsMode",
          }
        }
      });
      
      if (error) {
        throw error;
      }

      toast({
        title: "Sign up successful",
        description: "Please check your email to verify your account.",
      });
      
      sonnerToast.success("Account created", {
        description: "Please check your email to verify your account"
      });
      
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast({
        title: "Sign up failed",
        description: error.message || "An error occurred during sign up.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      // Store the current URL including any invite ID
      const returnUrl = window.location.pathname + window.location.search;
      localStorage.setItem('auth_return_url', returnUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        throw error;
      }
      
      // No toast needed here as user will be redirected to Google
    } catch (error: any) {
      console.error('Google login error:', error);
      toast({
        title: "Google login failed",
        description: error.message || "An error occurred during Google login.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
      
      navigate('/');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: error.message || "An error occurred during logout.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const showAuthRequiredToast = () => {
    toast({
      title: "Authentication Required",
      description: "Please sign up or log in to perform this action.",
      variant: "destructive",
    });
  };

  return { login, signUp, loginWithGoogle, logout, showAuthRequiredToast, loading };
};
