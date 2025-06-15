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

// Enhanced PointsDisplay Manager with comprehensive logging
const PointsDisplayManager = () => {
  const { points } = useUserPoints();
  const [lastKnownPoints, setLastKnownPoints] = useState<number | null>(null);
  const pointsDisplayRef = useRef<any>(null);

  console.log(`🎯 [PointsDisplayManager] RENDER - Points object:`, points);
  console.log(`🎯 [PointsDisplayManager] RENDER - LastKnown: ${lastKnownPoints}`);
  console.log(`🎯 [PointsDisplayManager] RENDER - Ref current:`, pointsDisplayRef.current);

  useEffect(() => {
    console.log(`🔍 [PointsDisplayManager] Effect triggered. Full points object:`, points);
    console.log(`🔍 [PointsDisplayManager] Effect - lastKnownPoints:`, lastKnownPoints);
    
    if (!points) {
      console.log(`⚠️ [PointsDisplayManager] No points data, skipping`);
      return;
    }

    const currentPoints = points.available_points;
    console.log(`🔍 [PointsDisplayManager] Current available_points: ${currentPoints}`);
    console.log(`🔍 [PointsDisplayManager] Last known points: ${lastKnownPoints}`);
    console.log(`🔍 [PointsDisplayManager] Points changed?: ${lastKnownPoints !== null && lastKnownPoints !== currentPoints}`);
    
    // Only trigger animation if we have a previous value and it's different
    if (lastKnownPoints !== null && lastKnownPoints !== currentPoints) {
      console.log(`✨ [PointsDisplayManager] ANIMATION TRIGGER! ${lastKnownPoints} -> ${currentPoints}`);
      
      console.log(`🔗 [PointsDisplayManager] Checking ref availability:`, pointsDisplayRef.current);
      if (pointsDisplayRef.current?.animatePoints) {
        console.log(`🚀 [PointsDisplayManager] CALLING animatePoints via ref`);
        pointsDisplayRef.current.animatePoints(currentPoints, lastKnownPoints);
      } else {
        console.log(`❌ [PointsDisplayManager] Ref or animatePoints method not available!`);
        console.log(`❌ [PointsDisplayManager] Ref object:`, pointsDisplayRef.current);
        console.log(`❌ [PointsDisplayManager] Has animatePoints?:`, pointsDisplayRef.current?.animatePoints);
      }
    } else if (lastKnownPoints === null) {
      console.log(`🏁 [PointsDisplayManager] First time setting points to ${currentPoints}`);
    } else {
      console.log(`🛑 [PointsDisplayManager] No animation needed (same value: ${currentPoints})`);
    }
    
    // Always update the last known points
    console.log(`📝 [PointsDisplayManager] Updating lastKnownPoints: ${lastKnownPoints} -> ${currentPoints}`);
    setLastKnownPoints(currentPoints);
  }, [points?.available_points, lastKnownPoints]); // Watch the specific value

  console.log(`🎯 [PointsDisplayManager] About to render PointsDisplay with ref`);

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className="p-1.5 rounded-full bg-gradient-to-r from-purple-500/15 to-pink-500/15 backdrop-blur-sm shadow-lg">
        <PointsDisplay ref={pointsDisplayRef} />
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
