import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";
import { AuthContextType } from './auth/types';
import { useAuthMethods } from './auth/useAuthMethods';
import { useProfileUpdates } from './auth/useProfileUpdates';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  const { 
    login, 
    signUp, 
    logout, 
    loginWithGoogle,
    showAuthRequiredToast, 
    loading: authMethodsLoading 
  } = useAuthMethods();
  
  const { 
    updateUserProfile, 
    updateLastActive 
  } = useProfileUpdates(user);

  // Update last_active_at timestamp periodically
  useEffect(() => {
    if (!user) return;
    
    // Update on initial load
    updateLastActive();
    
    // Then update every 5 minutes while active
    const interval = setInterval(updateLastActive, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    // First set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth state changed:', event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      }
    );

    // Then check for an existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated: !!user, 
      user, 
      session,
      login, 
      signUp,
      loginWithGoogle,
      logout, 
      showAuthRequiredToast,
      loading: loading || authMethodsLoading,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
