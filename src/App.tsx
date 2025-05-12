
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import InvitePage from "./pages/InvitePage";
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import { TaskProvider } from "./contexts/task/TaskContext";
import { RewardProvider } from "./contexts/reward/RewardContext";
import { NetworkStatusIndicator } from "./components/common/NetworkStatusIndicator";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Root path is accessible to all users (not protected) */}
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route 
        path="/invite" 
        element={
          <ProtectedRoute>
            <InvitePage />
          </ProtectedRoute>
        } 
      />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <div className="w-full max-w-[430px] h-screen mx-auto shadow-lg overflow-hidden bg-white">
          <BrowserRouter>
            <AuthProvider>
              <TaskProvider>
                <RewardProvider>
                  <AppRoutes />
                  <NetworkStatusIndicator />
                </RewardProvider>
              </TaskProvider>
            </AuthProvider>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
