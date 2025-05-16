
import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { toast as sonnerToast } from 'sonner';
import { useNavigate } from "react-router-dom";

export function useInviteAcceptanceState() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const clearError = useCallback(() => setError(null), []);
  
  const handleSuccess = useCallback((senderName?: string) => {
    console.log("🎉 Invite acceptance successful for partner:", senderName || 'unknown');
    
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
    
    // Force a short delay before redirecting to allow any database operations to complete
    // and to let the user see the success message
    console.log("⏱️ Setting timeout for navigation to home page");
    setTimeout(() => {
      console.log("🏠 Navigating to home page after successful invite acceptance");
      navigate('/', { replace: true });
    }, 1500);
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
