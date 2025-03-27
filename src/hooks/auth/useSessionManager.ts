
import { useCallback, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useSessionManager() {
  const refreshingRef = useRef(false);
  const refreshTimerRef = useRef<number | null>(null);
  
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
      console.log("Manually refreshing session");
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("Error refreshing session:", error);
        return false;
      }
      
      if (data.session) {
        console.log("Session refreshed successfully");
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
    }
    
    // Set up new timer
    refreshTimerRef.current = window.setInterval(() => {
      if (session) {
        console.log("Scheduled session refresh");
        refreshFn();
      }
    }, 10 * 60 * 1000); // Refresh every 10 minutes
    
    // Return cleanup function
    return () => {
      if (refreshTimerRef.current) {
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
      const { error: signOutError } = await supabase.auth.signOut();
      
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
