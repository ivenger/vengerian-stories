
import { useCallback, useEffect, useRef } from "react";
import { useAppVersion } from "./auth/useAppVersion";
import { useAuthState } from "./auth/useAuthState";
import { useAuthActions } from "./auth/useAuthActions";
import { useSessionManager } from "./auth/useSessionManager";

export function useAuthProvider() {
  // Initialize app version check
  useAppVersion();
  
  // Track component mount state
  const isMountedRef = useRef(true);
  
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
    if (!isMountedRef.current) {
      console.log("Component unmounted, cancelling refresh session");
      return false;
    }
    
    try {
      console.log("Attempting to refresh session in useAuthProvider");
      const success = await refreshSession();
      if (success && session) {
        console.log("Session refresh successful");
      } else if (!success) {
        console.warn("Session refresh failed");
      }
      return success;
    } catch (err) {
      console.error("Error in handleRefreshSession:", err);
      return false;
    }
  }, [refreshSession]);
  
  // Set up refresh timer whenever session changes
  useEffect(() => {
    // Skip if not mounted or no session
    if (!isMountedRef.current || !session) {
      return;
    }
    
    console.log("Setting up session refresh timer for session:", session.expires_at);
    
    const cleanup = setupRefreshTimer(session, handleRefreshSession);
    
    return () => {
      if (isMountedRef.current) {
        console.log("Cleaning up refresh timer in useAuthProvider (session changed)");
      }
      cleanup();
    };
  }, [session, setupRefreshTimer, handleRefreshSession]);

  // Track component lifecycle
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      console.log("useAuthProvider unmounting");
      isMountedRef.current = false;
    };
  }, []);

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
