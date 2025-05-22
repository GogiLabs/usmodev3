
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import InvitePage from "./pages/InvitePage";
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import { TaskProvider } from "./contexts/task";
import { RewardProvider } from "./contexts/reward/RewardContext";
import { NetworkStatusIndicator } from "./components/common/NetworkStatusIndicator";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { lazy, Suspense, useRef } from "react";
import { LoadingSpinner } from "./components/common/LoadingSpinner";
import { GuestToAuthModal } from "./components/common/GuestToAuthModal";
import { PointsDisplay } from "./components/common/PointsDisplay";
import { pointsDisplayRef } from "./components/tasks/TaskItem";

// Configure React Query with better error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnReconnect: "always",
    },
  },
});

// Protected Route Component with better loading state
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" text="Authenticating..." />
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Root path is accessible to all users (not protected) */}
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/invite" element={<InvitePage />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  // Create persistent pointsDisplayRef to avoid recreation on renders
  const isPointsDisplayMounted = useRef(false);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <div className="w-full max-w-[430px] h-screen mx-auto shadow-lg overflow-hidden bg-white">
          <BrowserRouter>
            <AuthProvider>
              <TaskProvider>
                <RewardProvider>
                  <AppRoutes />
                  <NetworkStatusIndicator />
                  <GuestToAuthModal />
                  
                  {/* Create a visible PointsDisplay that's accessible via ref with enhanced styling */}
                  <div className="fixed top-4 right-4 z-50 animate-fade-in">
                    <div className="p-1.5 rounded-full bg-gradient-to-r from-purple-500/15 to-pink-500/15 backdrop-blur-sm shadow-lg">
                      <PointsDisplay ref={(ref) => {
                        // Store the ref, but only do it once to avoid re-registering listeners
                        if (ref && !isPointsDisplayMounted.current) {
                          // @ts-ignore - We know this is the right type
                          pointsDisplayRef.current = ref;
                          isPointsDisplayMounted.current = true;
                          console.log('📌 [App] PointsDisplay ref registered successfully');
                        }
                      }} />
                    </div>
                  </div>
                </RewardProvider>
              </TaskProvider>
            </AuthProvider>
          </BrowserRouter>
          <Toaster />
          <Sonner />
        </div>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
