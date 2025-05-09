
import { AuthProvider } from "@/contexts/AuthContext";
import { TaskProvider } from "@/contexts/TaskContext";
import { RewardProvider } from "@/contexts/RewardContext";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { Toaster } from "@/components/ui/toaster";

const Index = () => {
  return (
    <AuthProvider>
      <TaskProvider>
        <RewardProvider>
          <Dashboard />
          <Toaster />
        </RewardProvider>
      </TaskProvider>
    </AuthProvider>
  );
};

export default Index;
