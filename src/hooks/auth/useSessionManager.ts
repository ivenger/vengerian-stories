
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SignOutResult {
  error: Error | null;
}

export function useSessionManager() {
  const [refreshInProgress, setRefreshInProgress] = useState(false);
  const timerIdRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up any existing timers
  const clearAllTimers = useCallback(() => {
    if (timerIdRef.current) {
      console.log("Clearing existing refresh timer");
      clearTimeout(timerIdRef.current);
      timerIdRef.current = null;
    }
  }, []);

  const refreshSession = useCallback(async () => {
    if (refreshInProgress) {
      console.log("Session refresh already in progress, skipping");
      return false;
    }
    
    try {
      setRefreshInProgress(true);
      console.log("Attempting to refresh session...");
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error("Session refresh failed:", error);
        setRefreshInProgress(false);
        return false;
      }

      console.log("Session refreshed successfully:", data?.session?.expires_at);
      setRefreshInProgress(false);
      return true;
    } catch (err) {
      console.error("Unexpected error during session refresh:", err);
      setRefreshInProgress(false);
      return false;
    }
  }, [refreshInProgress]);

  const setupRefreshTimer = useCallback((initialSession: any, refreshFn: () => Promise<boolean>) => {
    // Always clear existing timers first
    clearAllTimers();
    
    if (!initialSession?.expires_at) {
      console.warn("Session does not have an expiry time. Session refresh will not be set up.");
      return () => {};
    }

    const expiresAtMs = initialSession.expires_at * 1000;
    const timeUntilExpiry = expiresAtMs - Date.now();
    const refreshBuffer = 60 * 1000; // 1 minute before expiry
    const adjustedRefreshTime = Math.max(timeUntilExpiry - refreshBuffer, 0);

    if (adjustedRefreshTime <= 0) {
      console.warn("Session is already expired or about to expire immediately. Refreshing now.");
      refreshFn();
      return () => {};
    }

    console.log(`Setting up session refresh timer to run in ${Math.round(adjustedRefreshTime / 1000)} seconds (${new Date(Date.now() + adjustedRefreshTime).toLocaleTimeString()})`);

    const timer = setTimeout(() => {
      console.log("Session refresh timer is triggering...");
      refreshFn().then(success => {
        if (success) {
          console.log("Session refresh successful, timer will be reset with new session");
          // The new timer will be set by the useEffect in useAuthProvider when session changes
        } else {
          console.warn("Session refresh failed, setting up a retry");
          // Try again in 30 seconds
          const retryTimer = setTimeout(() => refreshFn(), 30 * 1000);
          timerIdRef.current = retryTimer;
        }
      });
    }, adjustedRefreshTime);

    timerIdRef.current = timer;

    return () => {
      console.log("Clearing session refresh timer in cleanup function");
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // Fix the signOut function to properly return a SignOutResult
  const signOut = async (): Promise<SignOutResult> => {
    try {
      console.log("Executing signOut in useSessionManager");
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Error signing out:", error);
      } else {
        console.log("Sign out successful");
        
        // Clear any refresh timers
        clearAllTimers();
      }
      
      return { error };
    } catch (error) {
      console.error("Error in signOut:", error);
      return { error: error as Error };
    }
  };

  // Add cleanup on component unmount
  useEffect(() => {
    return () => {
      console.log("Cleaning up timers on unmount (useSessionManager)");
      clearAllTimers();
    };
  }, [clearAllTimers]);

  return {
    refreshSession,
    setupRefreshTimer,
    signOut,
  };
}
