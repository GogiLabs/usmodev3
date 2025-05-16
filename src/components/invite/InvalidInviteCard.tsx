
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

type InvalidInviteCardProps = {
  reason: string;
  details?: string;
  showDebugInfo?: boolean;
  debugData?: any;
};

export function InvalidInviteCard({ 
  reason, 
  details,
  showDebugInfo = false,
  debugData
}: InvalidInviteCardProps) {
  const navigate = useNavigate();
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full max-w-md mx-auto shadow-lg border-red-100">
        <CardHeader>
          <CardTitle className="text-red-500">Invalid Invitation</CardTitle>
          <CardDescription>{reason}</CardDescription>
        </CardHeader>
        <CardContent>
          {details && (
            <p className="text-sm text-muted-foreground">
              {details}
            </p>
          )}
          
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-left">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Possible reasons:</p>
                <ul className="text-xs text-amber-700 mt-1 list-disc pl-5">
                  <li>The invitation link may have been copied incorrectly</li>
                  <li>The invitation may have been deleted by the sender</li>
                  <li>The invitation ID may be invalid</li>
                </ul>
              </div>
            </div>
          </div>
          
          {showDebugInfo && import.meta.env.DEV && debugData && (
            <div className="mt-4 p-2 bg-gray-100 rounded text-left">
              <details className="text-xs">
                <summary className="font-medium cursor-pointer">Debug Info</summary>
                <pre className="mt-2 overflow-auto max-h-40 text-gray-700">
                  {JSON.stringify(debugData, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={() => navigate("/")} variant="outline" className="w-full">
            Return Home
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
