
import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSessionRefresh = () => {
  // Use a ref to track recent refreshes and prevent multiple calls in quick succession
  const lastRefreshTimeRef = useRef<number>(0);
  const refreshInProgressRef = useRef<boolean>(false);
  const refreshIntervalMs = 300000; // Only refresh every 5 minutes at most (increased from 60s)

  const refreshSession = useCallback(async () => {
    try {
      // Prevent concurrent refresh operations
      if (refreshInProgressRef.current) {
        console.log("useSessionRefresh: Another refresh already in progress");
        return null;
      }

      // Check if we've refreshed recently to prevent excessive calls
      const now = Date.now();
      if (now - lastRefreshTimeRef.current < refreshIntervalMs) {
        return null;
      }
      
      refreshInProgressRef.current = true;
      lastRefreshTimeRef.current = now;
      
      // Attempt to refresh the session
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("useSessionRefresh: Failed to refresh session:", error.message);
        return null;
      }
      
      if (data?.session) {
        console.log("useSessionRefresh: Session refreshed successfully");
        return data.session;
      } else {
        console.warn("useSessionRefresh: No session after refresh attempt");
        return null;
      }
    } catch (err) {
      console.error("useSessionRefresh: Exception during session refresh:", err);
      return null;
    } finally {
      refreshInProgressRef.current = false;
    }
  }, []);

  const getActiveSession = useCallback(async () => {
    try {
      // Prevent concurrent operations
      if (refreshInProgressRef.current) {
        return null;
      }
      
      // Check if we've refreshed recently
      const now = Date.now();
      if (now - lastRefreshTimeRef.current < refreshIntervalMs) {
        return null;
      }
      
      // Get current session without refreshing
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("useSessionRefresh: Error getting session:", error.message);
        return null;
      }
      
      if (data?.session) {
        const expiresAt = data.session.expires_at ? new Date(data.session.expires_at * 1000) : null;
        const isExpired = expiresAt ? new Date() > expiresAt : false;
        const remainingTimeSeconds = expiresAt ? Math.floor((expiresAt.getTime() - Date.now()) / 1000) : null;
        
        // Only refresh if the session is expired or about to expire (less than 5 minutes)
        if (isExpired || (remainingTimeSeconds !== null && remainingTimeSeconds < 300)) {
          refreshInProgressRef.current = true;
          lastRefreshTimeRef.current = now;
          const result = await refreshSession();
          refreshInProgressRef.current = false;
          return result;
        }
        
        return data.session;
      } else {
        return null;
      }
    } catch (err) {
      console.error("useSessionRefresh: Exception getting session:", err);
      return null;
    }
  }, [refreshSession]);

  return {
    refreshSession,
    getActiveSession
  };
};
