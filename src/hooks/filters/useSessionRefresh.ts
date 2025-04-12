
import { useCallback, useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook for managing session refresh functionality
 */
export const useSessionRefresh = () => {
  const lastRefreshTime = useRef<number>(Date.now());
  const refreshInProgress = useRef<boolean>(false);
  
  // Function to check if a session refresh is needed
  const shouldRefreshSession = useCallback(() => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime.current;
    // Refresh if more than 5 minutes have passed since last refresh
    return timeSinceLastRefresh > 5 * 60 * 1000;
  }, []);
  
  const refreshSession = useCallback(async () => {
    // Don't attempt refresh if one is already in progress
    if (refreshInProgress.current) {
      console.log(`[${new Date().toISOString()}] Session refresh already in progress, skipping`);
      return true;
    }
    
    refreshInProgress.current = true;
    console.log(`[${new Date().toISOString()}] Attempting to refresh session`);
    
    try {
        const { error } = await supabase.auth.refreshSession();
        if (error) {
            console.error(`[${new Date().toISOString()}] Failed to refresh session:`, error);
            refreshInProgress.current = false;
            return false;
        }
        
        console.log(`[${new Date().toISOString()}] Session refreshed successfully`);
        lastRefreshTime.current = Date.now();
        refreshInProgress.current = false;
        return true;
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Error refreshing session:`, err);
        refreshInProgress.current = false;
        return false;
    }
  }, []);
  
  // Add effect to refresh session when navigating to a page
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log(`[${new Date().toISOString()}] Page became visible, checking session state`);
        
        if (shouldRefreshSession()) {
          console.log(`[${new Date().toISOString()}] Refreshing session due to navigation`);
          await refreshSession();
        }
      }
    };
    
    // Initial refresh when component mounts
    if (shouldRefreshSession()) {
      refreshSession();
    }
    
    // Add event listeners for visibility changes (navigating back to page)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshSession, shouldRefreshSession]);

  return { refreshSession, shouldRefreshSession };
};
