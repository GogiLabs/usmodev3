
import { AuthProvider } from "@/contexts/AuthContext";
import { TaskProvider } from "@/contexts/TaskContext";
import { RewardProvider } from "@/contexts/RewardContext";
import { Dashboard } from "@/components/dashboard/Dashboard";

const Index = () => {
  return (
    <AuthProvider>
      <TaskProvider>
        <RewardProvider>
          <Dashboard />
        </RewardProvider>
      </TaskProvider>
    </AuthProvider>
  );
};

export default Index;
