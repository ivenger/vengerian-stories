import { useCallback, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useSessionManager() {
  const refreshingRef = useRef(false);
  const refreshTimerRef = useRef<number | null>(null);
  const refreshRetryCountRef = useRef(0);
  const maxRefreshRetries = 3;
  
  /**
   * Refresh the user session
   * Includes debounce mechanism to prevent multiple simultaneous refreshes
   */
  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (refreshingRef.current) {
      console.log("Session refresh already in progress, skipping");
      return false;
    }

    try {
      refreshingRef.current = true;
      console.log(`Manually refreshing session (attempt ${refreshRetryCountRef.current + 1})`);
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("Error refreshing session:", error);
        
        // Handle network errors with a retry
        if (error.message?.includes("network") && refreshRetryCountRef.current < maxRefreshRetries) {
          refreshRetryCountRef.current++;
          const delayMs = 1000 * refreshRetryCountRef.current; // Increasing backoff
          
          console.log(`Will retry session refresh in ${delayMs}ms`);
          setTimeout(() => refreshSession(), delayMs);
          return false;
        }
        
        refreshRetryCountRef.current = 0;
        return false;
      }
      
      if (data.session) {
        console.log("Session refreshed successfully");
        refreshRetryCountRef.current = 0;
        return true;
      } else {
        console.log("No session returned from refresh");
        return false;
      }
    } catch (err) {
      console.error("Exception during session refresh:", err);
      return false;
    } finally {
      refreshingRef.current = false;
    }
  }, []);

  /**
   * Sets up and manages the session refresh timer
   */
  const setupRefreshTimer = useCallback((session: Session | null, refreshFn: () => Promise<boolean>) => {
    // Clear existing timer if any
    if (refreshTimerRef.current) {
      window.clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    
    // Only set up timer if we have a session
    if (session) {
      // Calculate refresh interval based on token expiry
      // Default to 10 minutes if we can't determine expiry
      let refreshInterval = 10 * 60 * 1000; // 10 minutes
      
      try {
        // Attempt to get expiry time to optimize refresh timing
        const expiresAt = session?.expires_at;
        if (expiresAt) {
          // Convert to milliseconds and subtract 5 minutes as buffer
          const expiryTime = expiresAt * 1000;
          const currentTime = Date.now();
          const timeUntilExpiry = expiryTime - currentTime;
          
          // If token expires in less than 10 minutes, refresh at half the time
          // Otherwise use a 10 minute interval
          if (timeUntilExpiry < refreshInterval) {
            refreshInterval = Math.max(timeUntilExpiry / 2, 30000); // Min 30 seconds
            console.log(`Token expires soon, setting refresh interval to ${refreshInterval / 1000}s`);
          }
        }
      } catch (err) {
        console.error("Error calculating token expiry:", err);
        // Keep default interval
      }
      
      // Set up new timer with calculated interval
      console.log(`Setting up session refresh timer with interval: ${refreshInterval / 1000}s`);
      refreshTimerRef.current = window.setInterval(() => {
        console.log("Scheduled session refresh");
        refreshFn().catch(err => console.error("Error in scheduled refresh:", err));
      }, refreshInterval);
    }
    
    // Return cleanup function
    return () => {
      if (refreshTimerRef.current) {
        console.log("Clearing session refresh timer");
        window.clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, []);

  /**
   * Sign out the current user
   */
  const signOut = async (): Promise<{ error?: Error }> => {
    try {
      console.log("Attempting to sign out");
      const { error: signOutError } = await supabase.auth.signOut({
        scope: 'local' // Only sign out on this device, to avoid network issues
      });
      
      if (signOutError) {
        console.error("Error signing out:", signOutError);
        return { error: signOutError };
      } else {
        console.log("Sign out successful");
        return {};
      }
    } catch (err) {
      console.error("Sign out exception:", err);
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  return {
    refreshSession,
    setupRefreshTimer,
    signOut
  };
}
