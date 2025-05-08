
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useToast } from "@/components/ui/use-toast";

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  showAuthRequiredToast: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // In Phase 1, auth is always false (no-auth mode)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const { toast } = useToast();

  const login = () => {
    // In Phase 1, this is just a placeholder
    toast({
      title: "Authentication",
      description: "Login will be implemented in a future phase.",
    });
  };

  const logout = () => {
    // In Phase 1, this is just a placeholder
    toast({
      title: "Authentication",
      description: "Logout will be implemented in a future phase.",
    });
  };

  const showAuthRequiredToast = () => {
    toast({
      title: "Authentication Required",
      description: "Please sign up or log in to perform this action.",
      variant: "destructive",
    });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, showAuthRequiredToast }}>
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
