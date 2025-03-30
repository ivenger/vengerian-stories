
import { useCallback, useEffect, useRef } from "react";
import { useAppVersion } from "./auth/useAppVersion";
import { useAuthState } from "./auth/useAuthState";
import { useAuthActions } from "./auth/useAuthActions";
import { useSessionManager } from "./auth/useSessionManager";

export function useAuthProvider() {
  // Initialize app version check
  useAppVersion();
  
  // Track if we already set up a refresh timer
  const refreshTimerSetupRef = useRef(false);
  
  // Get auth state
  const { 
    session, 
    user, 
    loading, 
    isAdmin, 
    error, 
    authInitialized,
    setSession
  } = useAuthState();
  
  // Get auth actions
  const { signOut, refreshSession } = useAuthActions(setSession);
  
  // Get session management
  const { setupRefreshTimer } = useSessionManager();
  
  // Handle session refreshing
  const handleRefreshSession = useCallback(async () => {
    try {
      console.log("Attempting to refresh session in useAuthProvider");
      const success = await refreshSession();
      if (success && session) {
        console.log("Session refresh successful");
        // No need to manually setSession as the auth state listener will handle it
      } else if (!success) {
        console.warn("Session refresh failed");
      }
      return success;
    } catch (err) {
      console.error("Error in handleRefreshSession:", err);
      return false;
    }
  }, [refreshSession, session]);
  
  // Set up refresh timer whenever session changes
  useEffect(() => {
    if (!session || refreshTimerSetupRef.current) return;
    
    console.log("Setting up session refresh timer");
    refreshTimerSetupRef.current = true;
    
    const cleanup = setupRefreshTimer(session, handleRefreshSession);
    
    return () => {
      console.log("Cleaning up refresh timer in useAuthProvider");
      cleanup();
      refreshTimerSetupRef.current = false;
    };
  }, [session, setupRefreshTimer, handleRefreshSession]);

  return {
    session,
    user,
    loading,
    signOut,
    isAdmin,
    error,
    refreshSession: handleRefreshSession,
    authInitialized,
  };
}
