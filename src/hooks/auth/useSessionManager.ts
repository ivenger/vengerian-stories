import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SignOutResult {
  error: Error | null;
}

export function useSessionManager() {
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const refreshSession = useCallback(async () => {
    try {
      console.log("Attempting to refresh session...");
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error("Session refresh failed:", error);
        return false;
      }

      console.log("Session refreshed successfully:", data);
      return true;
    } catch (err) {
      console.error("Unexpected error during session refresh:", err);
      return false;
    }
  }, []);

  const setupRefreshTimer = useCallback((initialSession: any, refreshFn: () => Promise<boolean>) => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }

    if (!initialSession?.expires_at) {
      console.warn("Session does not have an expiry time. Session refresh will not be set up.");
      return () => {};
    }

    const timeUntilExpiry = (initialSession.expires_at * 1000) - Date.now();
    const refreshBuffer = 60 * 1000;
    const adjustedRefreshTime = Math.max(timeUntilExpiry - refreshBuffer, 0);

    if (adjustedRefreshTime <= 0) {
      console.warn("Session is already expired or about to expire immediately. Refreshing now.");
      refreshFn();
      return () => {};
    }

    console.log(`Setting up session refresh timer to run in ${adjustedRefreshTime / 1000} seconds`);

    const timer = setTimeout(() => {
      console.log("Session refresh timer is triggering...");
      refreshFn();
    }, adjustedRefreshTime);

    setRefreshInterval(timer);

    return () => clearTimeout(timer);
  }, [refreshInterval]);

  const signOut = async (): Promise<SignOutResult> => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      console.error("Error in signOut:", error);
      return { error: error as Error };
    }
  };

  return {
    refreshSession,
    setupRefreshTimer,
    signOut,
  };
}
