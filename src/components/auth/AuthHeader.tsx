
import { Heart } from "lucide-react";

interface AuthHeaderProps {
  inviteId: string | null;
}

export const AuthHeader = ({ inviteId }: AuthHeaderProps) => {
  return (
    <div className="mb-8 flex flex-col items-center">
      <div className="flex items-center gap-2 text-3xl font-bold text-primary">
        <Heart className="h-8 w-8 text-primary fill-primary" />
        <h1>
          <span className="text-primary">Us</span>
          <span className="text-accent">Mode</span>
        </h1>
      </div>
      <p className="mt-2 text-muted-foreground">
        {inviteId 
          ? "Create an account or sign in to accept your invitation"
          : "Create shared tasks and rewards with your partner"}
      </p>
    </div>
  );
};
