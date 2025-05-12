
import { useState, useEffect, useMemo } from 'react';

type ConnectionStatus = 'online' | 'offline';

export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>(() => 
    navigator.onLine ? 'online' : 'offline'
  );
  const [previousStatus, setPreviousStatus] = useState<ConnectionStatus>(status);
  const [lastChanged, setLastChanged] = useState<Date | null>(null);
  
  useEffect(() => {
    const handleOnline = () => {
      setPreviousStatus(status);
      setStatus('online');
      setLastChanged(new Date());
    };
    
    const handleOffline = () => {
      setPreviousStatus(status);
      setStatus('offline');
      setLastChanged(new Date());
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [status]);
  
  const statusInfo = useMemo(() => {
    return {
      isOnline: status === 'online',
      isOffline: status === 'offline',
      connectionStatus: status,
      previousStatus,
      lastChanged,
      justWentOnline: previousStatus === 'offline' && status === 'online',
      justWentOffline: previousStatus === 'online' && status === 'offline',
      timeSinceLastChange: lastChanged ? new Date().getTime() - lastChanged.getTime() : null
    };
  }, [status, previousStatus, lastChanged]);
  
  return statusInfo;
}
