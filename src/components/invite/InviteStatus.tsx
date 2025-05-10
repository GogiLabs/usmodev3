
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

type StatusDisplayProps = {
  status: 'checking' | 'valid' | 'invalid' | 'accepted' | 'expired';
  senderName?: string;
};

export function InviteStatusDisplay({ status, senderName }: StatusDisplayProps) {
  if (status === 'checking') {
    return <div className="animate-pulse">Loading...</div>;
  }
  
  if (status === 'valid') {
    return (
      <div className="flex flex-col items-center space-y-4">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <p>Ready to connect and start using UsMode together!</p>
      </div>
    );
  }
  
  if (status === 'invalid') {
    return (
      <div className="flex flex-col items-center space-y-4">
        <XCircle className="h-16 w-16 text-red-500" />
        <p>The invitation link you followed is not valid.</p>
      </div>
    );
  }
  
  if (status === 'expired') {
    return (
      <div className="flex flex-col items-center space-y-4">
        <AlertCircle className="h-16 w-16 text-amber-500" />
        <p>This invitation has expired. Please ask for a new invitation.</p>
      </div>
    );
  }
  
  if (status === 'accepted') {
    return (
      <div className="flex flex-col items-center space-y-4">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <p>Connection successful! Redirecting to your dashboard...</p>
      </div>
    );
  }
  
  return null;
}
