
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { toast as sonnerToast } from 'sonner';
import { useConnectionStatus } from './use-connection-status';

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

interface SyncOptions {
  syncInterval?: number; // in ms
  retryDelay?: number; // in ms
  maxRetries?: number;
  onSyncStart?: () => void;
  onSyncSuccess?: () => void;
  onSyncError?: (error: Error) => void;
}

export function useSyncStatus(
  syncFunction: () => Promise<void>,
  dependencies: any[] = [],
  options: SyncOptions = {}
) {
  const {
    syncInterval = 60000, // 1 minute by default
    retryDelay = 5000, // 5 seconds by default
    maxRetries = 3,
    onSyncStart,
    onSyncSuccess,
    onSyncError
  } = options;
  
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { isOnline, connectionStatus } = useConnectionStatus();
  const { toast } = useToast();
  
  const syncTimeoutRef = useRef<number | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  
  // Clear any existing timeouts on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current);
      if (retryTimeoutRef.current) window.clearTimeout(retryTimeoutRef.current);
    };
  }, []);
  
  // When connection status changes
  useEffect(() => {
    if (isOnline && status === 'error') {
      // If we're back online and had a previous error, attempt to sync
      sonnerToast.info("Connection restored", {
        description: "Attempting to sync data..."
      });
      sync();
    }
  }, [connectionStatus]);
  
  const sync = async () => {
    // Don't sync if offline
    if (!isOnline) {
      setStatus('error');
      setError(new Error("No internet connection"));
      if (onSyncError) onSyncError(new Error("No internet connection"));
      return;
    }
    
    // Clear any existing timeouts
    if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current);
    if (retryTimeoutRef.current) window.clearTimeout(retryTimeoutRef.current);
    
    setStatus('syncing');
    if (onSyncStart) onSyncStart();
    
    try {
      await syncFunction();
      setStatus('synced');
      setLastSynced(new Date());
      setRetryCount(0);
      setError(null);
      if (onSyncSuccess) onSyncSuccess();
      
      // Schedule next sync
      syncTimeoutRef.current = window.setTimeout(sync, syncInterval);
    } catch (err) {
      console.error("Sync error:", err);
      setStatus('error');
      
      const error = err instanceof Error ? err : new Error("An error occurred during sync");
      setError(error);
      
      if (onSyncError) onSyncError(error);
      
      // Retry logic
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        retryTimeoutRef.current = window.setTimeout(sync, retryDelay);
      } else {
        toast({
          title: "Sync failed",
          description: "We're having trouble syncing your data. Please check your connection.",
          variant: "destructive",
        });
      }
    }
  };
  
  // Run sync when dependencies change
  useEffect(() => {
    sync();
  }, [...dependencies]);
  
  return {
    status,
    isLoading: status === 'syncing',
    isError: status === 'error',
    isSynced: status === 'synced',
    lastSynced,
    error,
    retryCount,
    manualSync: sync,
  };
}
