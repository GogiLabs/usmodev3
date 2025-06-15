


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
import { lazy, Suspense, useRef, useState, useEffect } from "react";
import { LoadingSpinner } from "./components/common/LoadingSpinner";
import { GuestToAuthModal } from "./components/common/GuestToAuthModal";
import { PointsDisplay } from "./components/common/PointsDisplay";
import { useUserPoints } from "./hooks/use-user-points";

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

// Enhanced PointsDisplay Manager that responds immediately to points changes
const PointsDisplayManager = () => {
  const { points } = useUserPoints();
  const pointsDisplayRef = useRef<any>(null);
  const lastKnownPointsRef = useRef<number | null>(null);
  const [renderKey, setRenderKey] = useState(0);

  console.log(`🎯 [PointsDisplayManager] RENDER #${renderKey} - Points object:`, points);
  console.log(`🎯 [PointsDisplayManager] RENDER #${renderKey} - LastKnown: ${lastKnownPointsRef.current}`);
  console.log(`🎯 [PointsDisplayManager] RENDER #${renderKey} - Ref current:`, pointsDisplayRef.current);

  // Direct effect that triggers immediately when points.available_points changes
  useEffect(() => {
    if (!points?.available_points) {
      console.log(`⚠️ [PointsDisplayManager] No points data, skipping`);
      return;
    }

    const currentPoints = points.available_points;
    const lastKnown = lastKnownPointsRef.current;
    
    console.log(`🔍 [PointsDisplayManager] Effect triggered - Current: ${currentPoints}, Last: ${lastKnown}`);
    
    // Only trigger animation if we have a previous value and it's different
    if (lastKnown !== null && lastKnown !== currentPoints) {
      console.log(`✨ [PointsDisplayManager] ANIMATION TRIGGER! ${lastKnown} -> ${currentPoints}`);
      
      if (pointsDisplayRef.current?.animatePoints) {
        console.log(`🚀 [PointsDisplayManager] CALLING animatePoints via ref`);
        pointsDisplayRef.current.animatePoints(currentPoints, lastKnown);
      } else {
        console.log(`❌ [PointsDisplayManager] Ref or animatePoints method not available!`);
      }
    } else if (lastKnown === null) {
      console.log(`🏁 [PointsDisplayManager] First time setting points to ${currentPoints}`);
    }
    
    // Update the ref immediately
    lastKnownPointsRef.current = currentPoints;
    console.log(`📝 [PointsDisplayManager] Updated lastKnownPointsRef to ${currentPoints}`);
    
    // Force a re-render to ensure we capture all changes
    setRenderKey(prev => prev + 1);
    console.log(`🔄 [PointsDisplayManager] Forced re-render with key ${renderKey + 1}`);
  }, [points, points?.available_points, renderKey]); // Watch both the entire points object AND the specific value

  console.log(`🎯 [PointsDisplayManager] About to render PointsDisplay with ref (render #${renderKey})`);

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className="p-1.5 rounded-full bg-gradient-to-r from-purple-500/15 to-pink-500/15 backdrop-blur-sm shadow-lg">
        <PointsDisplay ref={pointsDisplayRef} key={`points-${renderKey}`} />
      </div>
    </div>
  );
};

const App = () => {
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
                  
                  {/* Enhanced PointsDisplay management with detailed logging */}
                  <PointsDisplayManager />
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


