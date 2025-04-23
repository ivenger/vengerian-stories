
import { useState, useCallback } from 'react';
import { checkSupabaseConnection } from '@/services/blogService';
import { useToast } from '../use-toast';

export const useConnectionStatus = () => {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const { toast } = useToast();
  
  const checkConnection = useCallback(async () => {
    setConnectionStatus('checking');
    const status = await checkSupabaseConnection();
    setConnectionStatus(status.connected ? 'ok' : 'error');
    return status.connected;
  }, []);
  
  const handleConnectionError = () => {
    if (connectionStatus === 'error') {
      toast({
        title: "Connection issue detected",
        description: "Having trouble accessing our servers. Some features may be limited.",
        duration: 5000,
        variant: "destructive",
      });
    }
  };
  
  return {
    connectionStatus,
    checkConnection,
    handleConnectionError
  };
};
