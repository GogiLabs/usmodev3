
import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { toast as sonnerToast } from 'sonner';
import { useNavigate } from "react-router-dom";

type InviteData = {
  pair_id?: string;
  sender_name?: string;
  sender_email?: string;
} | null;

export function useInviteAcceptanceState() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const clearError = useCallback(() => setError(null), []);
  
  const handleSuccess = useCallback((senderName?: string) => {
    // Show success toasts
    toast({
      title: "Invitation accepted!",
      description: `You are now connected with ${senderName || 'your partner'}.`,
    });
    
    sonnerToast.success("Connection established!", {
      description: `You are now paired with ${senderName || 'your partner'}.`
    });
    
    // Clear any potential pending invite ID from storage
    localStorage.removeItem('pending_invite_id');
    
    // Add a slight delay before redirecting to allow the user to read the success message
    setTimeout(() => {
      navigate('/');
    }, 800);
  }, [toast, navigate]);
  
  const handleError = useCallback((error: any) => {
    const errorMessage = error.message || "An unexpected error occurred";
    
    console.error("❌ Error handling invite:", error);
    setError(error instanceof Error ? error : new Error(errorMessage));
    
    toast({
      title: "Failed to process invitation",
      description: errorMessage,
      variant: "destructive",
    });
  }, [toast]);
  
  return {
    loading,
    setLoading,
    error,
    setError,
    clearError,
    handleSuccess,
    handleError,
    toast
  };
}
