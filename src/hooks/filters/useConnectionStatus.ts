
import { useState, useCallback } from 'react';
import { checkSupabaseConnection } from '@/services/blogService';
import { useToast } from '../use-toast';

export const useConnectionStatus = () => {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const { toast } = useToast();
  
  const checkConnection = useCallback(async () => {
    setConnectionStatus('checking');
    try {
      const status = await checkSupabaseConnection();
      const newStatus = status.connected ? 'ok' : 'error';
      setConnectionStatus(newStatus);
      return status.connected;
    } catch (err) {
      console.error("Error checking connection:", err);
      setConnectionStatus('error');
      return false;
    }
  }, []);
  
  const handleConnectionError = useCallback(() => {
    if (connectionStatus === 'error') {
      toast({
        title: "Connection issue detected",
        description: "Having trouble accessing our servers. Some features may be limited.",
        duration: 5000,
        variant: "destructive",
      });
    }
  }, [connectionStatus, toast]);
  
  return {
    connectionStatus,
    checkConnection,
    handleConnectionError
  };
};
