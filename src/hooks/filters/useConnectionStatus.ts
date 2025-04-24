
import { useState, useCallback, useEffect } from 'react';
import { checkSupabaseConnection } from '@/services/blogService';
import { useToast } from '../use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useConnectionStatus = () => {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'not-authenticated'>('checking');
  const { toast } = useToast();
  
  const checkConnection = useCallback(async () => {
    setConnectionStatus('checking');
    try {
      console.log("Checking Supabase connection...");
      const status = await checkSupabaseConnection();
      const newStatus = status.connected ? 'ok' : 'error';
      console.log(`Connection check result: ${newStatus}, response time: ${status.responseTime}ms`);
      setConnectionStatus(newStatus);
      
      // Also check authentication status
      const { data } = await supabase.auth.getSession();
      const isAuthenticated = !!data?.session;
      setAuthStatus(isAuthenticated ? 'authenticated' : 'not-authenticated');
      console.log(`Authentication status: ${isAuthenticated ? 'authenticated' : 'not authenticated'}`);
      
      if (!isAuthenticated) {
        // Check if we have a token in localStorage that might be invalid
        const token = localStorage.getItem('sb-dvalgsvmkrqzwfcxvbxg-auth-token');
        if (token) {
          console.warn("Found auth token in localStorage but no valid session");
        }
      }
      
      return status.connected;
    } catch (err) {
      console.error("Error checking connection:", err);
      setConnectionStatus('error');
      setAuthStatus('checking');
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

  const handleAuthError = useCallback(() => {
    if (authStatus === 'not-authenticated' && connectionStatus === 'ok') {
      toast({
        title: "Authentication required",
        description: "Your session has expired or you are not logged in. Please sign in to continue.",
        duration: 5000,
        variant: "destructive",
      });
    }
  }, [authStatus, connectionStatus, toast]);

  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);
  
  return {
    connectionStatus,
    authStatus,
    checkConnection,
    handleConnectionError,
    handleAuthError
  };
};
