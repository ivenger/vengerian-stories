
import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSessionRefresh = () => {
  // Use a ref to track recent refreshes and prevent multiple calls in quick succession
  const lastRefreshTimeRef = useRef<number>(0);
  const refreshInProgressRef = useRef<boolean>(false);
  const refreshIntervalMs = 60000; // Only refresh every 60 seconds at most (increased from 30s)

  const refreshSession = useCallback(async () => {
    try {
      // Prevent concurrent refresh operations
      if (refreshInProgressRef.current) {
        console.log("useSessionRefresh: Skipping refresh - another refresh already in progress");
        return null;
      }

      // Check if we've refreshed recently to prevent excessive calls
      const now = Date.now();
      if (now - lastRefreshTimeRef.current < refreshIntervalMs) {
        console.log(`useSessionRefresh: Skipping refresh - too soon since last refresh (${Math.floor((now - lastRefreshTimeRef.current) / 1000)}s < ${refreshIntervalMs / 1000}s)`);
        return null;
      }
      
      console.log("useSessionRefresh: Starting session refresh");
      refreshInProgressRef.current = true;
      lastRefreshTimeRef.current = now;
      
      // First check if we have a session stored in localStorage to debug issues
      const localStorageSession = localStorage.getItem('sb-dvalgsvmkrqzwfcxvbxg-auth-token');
      console.log("useSessionRefresh: localStorage session exists:", !!localStorageSession);
      
      // Attempt to refresh the session
      const { data, error } = await supabase.auth.refreshSession();
      
      // Log detailed information about the refresh attempt
      if (error) {
        console.error("useSessionRefresh: Failed to refresh session:", error.message, error);
        return null;
      }
      
      if (data?.session) {
        console.log("useSessionRefresh: Session successfully refreshed, user ID:", data.session.user.id);
        console.log("useSessionRefresh: Session expires at:", new Date(data.session.expires_at! * 1000).toISOString());
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
        console.log("useSessionRefresh: Skipping active session check - refresh in progress");
        return null;
      }
      
      // Check if we've refreshed recently
      const now = Date.now();
      const shouldSkipCheck = (now - lastRefreshTimeRef.current < refreshIntervalMs);
      
      if (shouldSkipCheck) {
        console.log(`useSessionRefresh: Skipping active session check - checked recently (${Math.floor((now - lastRefreshTimeRef.current) / 1000)}s < ${refreshIntervalMs / 1000}s)`);
        return null;
      }
      
      console.log("useSessionRefresh: Checking for active session");
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("useSessionRefresh: Error getting session:", error.message, error);
        return null;
      }
      
      if (data?.session) {
        const expiresAt = data.session.expires_at ? new Date(data.session.expires_at * 1000) : null;
        const isExpired = expiresAt ? new Date() > expiresAt : false;
        const remainingTimeSeconds = expiresAt ? Math.floor((expiresAt.getTime() - Date.now()) / 1000) : null;
        
        console.log("useSessionRefresh: Session found", {
          userId: data.session.user.id,
          expiresAt: expiresAt?.toISOString(),
          isExpired,
          remainingTime: remainingTimeSeconds ? `${remainingTimeSeconds} seconds` : "unknown"
        });
        
        // Only refresh if the session is expired or about to expire (less than 5 minutes)
        if (isExpired || (remainingTimeSeconds !== null && remainingTimeSeconds < 300)) {
          console.log("useSessionRefresh: Session is expired or about to expire, refreshing");
          refreshInProgressRef.current = true;
          lastRefreshTimeRef.current = now;
          const result = await refreshSession();
          refreshInProgressRef.current = false;
          return result;
        }
        
        return data.session;
      } else {
        console.warn("useSessionRefresh: No session found");
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
