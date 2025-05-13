
import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
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
          emailRedirectTo: `https://www.us-mode.link/auth/callback`,
          data: {
            email_sender_name: "UsMode",
            email_sender_email: "register@us-mode.link"
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
    } catch (error: any) {
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
    } catch (error: any) {
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

  return { login, signUp, logout, showAuthRequiredToast, loading };
};
