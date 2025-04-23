
import { useState, useCallback, useEffect } from 'react';
import { checkSupabaseConnection } from '@/services/blogService';
import { useToast } from '../use-toast';

export const useConnectionStatus = () => {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const { toast } = useToast();
  
  const checkConnection = useCallback(async () => {
    setConnectionStatus('checking');
    try {
      console.log("Checking Supabase connection...");
      const status = await checkSupabaseConnection();
      const newStatus = status.connected ? 'ok' : 'error';
      console.log(`Connection check result: ${newStatus}, response time: ${status.responseTime}ms`);
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

  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, []);
  
  return {
    connectionStatus,
    checkConnection,
    handleConnectionError
  };
};
