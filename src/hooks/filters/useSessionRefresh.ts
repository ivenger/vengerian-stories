
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
      return false;
    }
    
    refreshInProgress.current = true;
    console.log(`[${new Date().toISOString()}] Attempting to refresh session`);
    
    try {
      // First check if we actually have a session to refresh
      const { data: sessionData } = await supabase.auth.getSession();
      
      // If no session exists, don't try to refresh
      if (!sessionData?.session) {
        console.log(`[${new Date().toISOString()}] No session to refresh`);
        refreshInProgress.current = false;
        return false;
      }
      
      // Create a timeout promise to prevent hanging
      const timeoutPromise = new Promise<{error: Error}>((_, reject) => {
        setTimeout(() => reject(new Error('Session refresh timeout')), 5000);
      });
      
      try {
        // Race between the actual refresh and the timeout
        const result = await Promise.race([
          supabase.auth.refreshSession(),
          timeoutPromise
        ]);
        
        // If the result is from the timeoutPromise (has only error property)
        if ('error' in result && !('data' in result)) {
          throw result.error;
        }
        
        // Now we know it's the AuthResponse
        const { data, error } = result;
        
        if (error) {
          console.error(`[${new Date().toISOString()}] Failed to refresh session:`, error);
          refreshInProgress.current = false;
          return false;
        }
        
        console.log(`[${new Date().toISOString()}] Session refreshed successfully:`, !!data.session);
        lastRefreshTime.current = Date.now();
        refreshInProgress.current = false;
        return !!data.session;
      } catch (err) {
        console.error(`[${new Date().toISOString()}] Error in refresh race:`, err);
        refreshInProgress.current = false;
        return false;
      }
      
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Error refreshing session:`, err);
      refreshInProgress.current = false;
      return false;
    }
  }, []);
  
  // Add effect to refresh session when navigating to a page
  useEffect(() => {
    let timeoutIds: number[] = [];
    let mounted = true;

    const handleVisibilityChange = async () => {
      if (!mounted || document.visibilityState !== 'visible') return;
      
      console.log(`[${new Date().toISOString()}] Page became visible, checking session state`);
      
      if (shouldRefreshSession()) {
        console.log(`[${new Date().toISOString()}] Refreshing session due to navigation`);
        await refreshSession();
      }
    };
    
    // Initial session check when component mounts, but with delay to avoid blocking page load
    const initialCheckTimeoutId = setTimeout(() => {
      if (mounted) {
        // Quick session check (non-refreshing)
        supabase.auth.getSession().then(({ data: { session } }) => {
          console.log(`[${new Date().toISOString()}] Initial session check:`, !!session);
          
          // If session exists but should be refreshed, refresh it
          if (session && shouldRefreshSession()) {
            refreshSession();
          }
        });
      }
    }, 1000) as unknown as number;
    
    timeoutIds.push(initialCheckTimeoutId);
    
    // Add event listeners for visibility changes (navigating back to page)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also set an interval to periodically check the session status
    const intervalId = setInterval(() => {
      if (shouldRefreshSession() && document.visibilityState === 'visible' && mounted) {
        console.log(`[${new Date().toISOString()}] Periodic session check triggered`);
        refreshSession();
      }
    }, 60 * 1000); // Check every minute
    
    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
      // Clear any pending timeouts
      timeoutIds.forEach(id => window.clearTimeout(id));
    };
  }, [refreshSession, shouldRefreshSession]);

  return { refreshSession, shouldRefreshSession };
};
