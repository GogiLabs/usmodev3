
import { useState, useEffect } from 'react';

type ConnectionStatus = 'online' | 'offline';

export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>(() => 
    navigator.onLine ? 'online' : 'offline'
  );
  
  useEffect(() => {
    const handleOnline = () => setStatus('online');
    const handleOffline = () => setStatus('offline');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return {
    isOnline: status === 'online',
    isOffline: status === 'offline',
    connectionStatus: status
  };
}
