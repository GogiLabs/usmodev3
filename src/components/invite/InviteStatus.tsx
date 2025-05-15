
import React from "react";
import { CheckCircle, XCircle, Clock, AlertCircle, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";

type InviteStatusProps = {
  status: "checking" | "valid" | "invalid" | "accepted" | "expired" | "auth_required";
  senderName?: string;
  onRetry?: () => void;
};

export function InviteStatusDisplay({
  status,
  senderName,
  onRetry
}: InviteStatusProps) {
  return (
    <div className="flex flex-col items-center p-4">
      {status === "checking" && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-blue-500 border-b-gray-200 border-l-gray-200 border-r-gray-200 mx-auto mb-4"></div>
          <p className="text-gray-500">Checking invitation status...</p>
        </div>
      )}

      {status === "valid" && (
        <div className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <p className="text-lg font-medium">Valid Invitation</p>
          {senderName && (
            <p className="text-gray-600 mt-2">
              {senderName} has invited you to collaborate
            </p>
          )}
        </div>
      )}

      {status === "auth_required" && (
        <div className="text-center">
          <LockKeyhole className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <p className="text-lg font-medium">Authentication Required</p>
          <p className="text-gray-600 mt-2">
            You need to sign in first to view this invitation
          </p>
        </div>
      )}

      {status === "invalid" && (
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium">Invalid Invitation</p>
          <p className="text-gray-600 mt-2">
            This invitation link is invalid or has been revoked
          </p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm" className="mt-4">
              Try Again
            </Button>
          )}
        </div>
      )}

      {status === "expired" && (
        <div className="text-center">
          <Clock className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <p className="text-lg font-medium">Expired Invitation</p>
          <p className="text-gray-600 mt-2">
            This invitation has expired. Please ask for a new one.
          </p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm" className="mt-4">
              Check Again
            </Button>
          )}
        </div>
      )}

      {status === "accepted" && (
        <div className="text-center">
          <div className="rounded-full bg-green-100 p-3 mb-4 mx-auto inline-block">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <p className="text-green-600 font-medium text-lg">
            You've successfully connected with {senderName || "your partner"}!
          </p>
          <div className="mt-4 text-sm text-gray-500">
            <p>Your synchronization is complete.</p>
          </div>
        </div>
      )}
    </div>
  );
}
