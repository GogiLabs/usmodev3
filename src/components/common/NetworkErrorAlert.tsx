
import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface NetworkErrorAlertProps {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function NetworkErrorAlert({ 
  message = "There was a problem connecting to the server. Please check your internet connection.", 
  onRetry,
  retryLabel = "Retry"
}: NetworkErrorAlertProps) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Connection Error</AlertTitle>
      <AlertDescription className="mt-2">
        {message}
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm"
            className="mt-2" 
            onClick={onRetry}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> {retryLabel}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
