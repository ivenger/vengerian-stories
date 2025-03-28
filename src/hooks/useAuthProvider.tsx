
import { useCallback } from "react";
import { useAppVersion } from "./auth/useAppVersion";
import { useAuthState } from "./auth/useAuthState";
import { useAuthActions } from "./auth/useAuthActions";
import { useSessionManager } from "./auth/useSessionManager";

export function useAuthProvider() {
  // Initialize app version check
  useAppVersion();
  
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
      const success = await refreshSession();
      if (success && session) {
        setSession(session);
      }
      return success;
    } catch (err) {
      console.error("Error in handleRefreshSession:", err);
      return false;
    }
  }, [refreshSession, session, setSession]);
  
  // Set up refresh timer whenever session changes
  useCallback(() => {
    if (session) {
      return setupRefreshTimer(session, handleRefreshSession);
    }
    return () => {};
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
