
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

type StatusDisplayProps = {
  status: 'checking' | 'valid' | 'invalid' | 'accepted' | 'expired';
  senderName?: string;
};

export function InviteStatusDisplay({ status, senderName }: StatusDisplayProps) {
  if (status === 'checking') {
    return (
      <div className="flex flex-col items-center space-y-4 animate-pulse">
        <Loader2 className="h-16 w-16 text-purple-500 animate-spin" />
        <p>Checking invitation status...</p>
      </div>
    );
  }
  
  if (status === 'valid') {
    return (
      <motion.div 
        className="flex flex-col items-center space-y-4"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <CheckCircle className="h-16 w-16 text-green-500" />
        <p className="text-center">
          <span className="font-semibold">{senderName || 'Someone'}</span> has invited you 
          to connect and start using UsMode together!
        </p>
      </motion.div>
    );
  }
  
  if (status === 'invalid') {
    return (
      <motion.div 
        className="flex flex-col items-center space-y-4"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <XCircle className="h-16 w-16 text-red-500" />
        <p className="text-center">The invitation link you followed is not valid or has been revoked.</p>
        <p className="text-sm text-muted-foreground">Please ask for a new invitation if you think this is a mistake.</p>
      </motion.div>
    );
  }
  
  if (status === 'expired') {
    return (
      <motion.div 
        className="flex flex-col items-center space-y-4"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <AlertCircle className="h-16 w-16 text-amber-500" />
        <p className="text-center">This invitation has expired.</p>
        <p className="text-sm text-muted-foreground">Invitations are valid for 7 days. Please ask for a new invitation.</p>
      </motion.div>
    );
  }
  
  if (status === 'accepted') {
    return (
      <motion.div 
        className="flex flex-col items-center space-y-4"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
        transition={{ 
          duration: 0.8,
          y: { 
            times: [0, 0.5, 1],
            duration: 1,
            repeat: 1
          }
        }}
      >
        <CheckCircle className="h-16 w-16 text-green-500" />
        <p className="text-center">Connection successful!</p>
        <p className="text-sm text-muted-foreground animate-pulse">Redirecting to your dashboard...</p>
      </motion.div>
    );
  }
  
  return null;
}
