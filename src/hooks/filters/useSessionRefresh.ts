
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
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise<{error?: Error}>((_, reject) => {
        setTimeout(() => reject(new Error('Session refresh timeout')), 3000);
      });
      
      // Race between the actual refresh and the timeout
      const result = await Promise.race([
        supabase.auth.refreshSession(),
        timeoutPromise
      ]);
      
      if (result.error) {
        console.error(`[${new Date().toISOString()}] Failed to refresh session:`, result.error);
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
    let timeoutIds: number[] = [];
    let mounted = true;

    const handleVisibilityChange = async () => {
      if (!mounted || document.visibilityState !== 'visible') return;
      
      console.log(`[${new Date().toISOString()}] Page became visible, checking session state`);
      
      if (shouldRefreshSession()) {
        console.log(`[${new Date().toISOString()}] Refreshing session due to navigation`);
        await refreshSession();
      } else {
        // Lightweight session check that doesn't block other operations
        try {
          const timeoutId = window.setTimeout(() => {
            console.log(`[${new Date().toISOString()}] Session check timed out after 2 seconds`);
          }, 2000);
          
          timeoutIds.push(timeoutId);
          
          // Use a non-blocking approach
          supabase.auth.getSession().then(({ data }) => {
            if (!mounted) return;
            window.clearTimeout(timeoutId);
            
            if (data?.session) {
              console.log(`[${new Date().toISOString()}] Session is valid, last refreshed ${new Date(lastRefreshTime.current).toISOString()}`);
            } else {
              console.log(`[${new Date().toISOString()}] Session missing or invalid, triggering refresh`);
              refreshSession();
            }
          }).catch(err => {
            if (!mounted) return;
            console.error(`[${new Date().toISOString()}] Error checking session:`, err);
            refreshSession();
          });
        } catch (err) {
          if (!mounted) return;
          console.error(`[${new Date().toISOString()}] Error in session check:`, err);
        }
      }
    };
    
    // Initial refresh when component mounts, but with delay to avoid blocking page load
    const initialCheckTimeoutId = setTimeout(() => {
      if (shouldRefreshSession() && mounted) {
        refreshSession();
      }
    }, 1000);
    
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
