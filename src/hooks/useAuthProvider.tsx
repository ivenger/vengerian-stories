
import { useSession } from "./auth/useSession";
import { useAdminCheck } from "./auth/useAdminCheck";
import { useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAuthProvider() {
  const { session, loading: sessionLoading, error: sessionError, signOut: sessionSignOut } = useSession();
  const { isAdmin, loading: adminLoading, error: adminError } = useAdminCheck(session);
  
  // Refresh function that components can call directly when needed
  const refreshSession = useCallback(async () => {
    try {
      console.log("useAuthProvider - Manually refreshing session");
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error("useAuthProvider - Failed to refresh session:", error);
        return null;
      } else if (data.session) {
        console.log("useAuthProvider - Session refreshed successfully");
        return data.session;
      }
      return null;
    } catch (err) {
      console.error("useAuthProvider - Error refreshing session:", err);
      return null;
    }
  }, []);
  
  // Improved signOut that handles errors and timeouts
  const signOut = useCallback(async () => {
    console.log("useAuthProvider - Attempting to sign out");
    try {
      // Create a timeout promise to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sign out operation timed out')), 5000);
      });
      
      // Race between the actual signOut and the timeout
      await Promise.race([
        sessionSignOut(),
        timeoutPromise
      ]);
      
      console.log("useAuthProvider - Signed out successfully");
      
      // Force clear local storage as a fallback
      try {
        localStorage.removeItem('sb-dvalgsvmkrqzwfcxvbxg-auth-token');
      } catch (e) {
        console.warn("Could not clear localStorage:", e);
      }
      
      // Force refresh the page as a last resort if needed
      // This is optional, but can help ensure a clean state
      // window.location.href = '/';
      
    } catch (err) {
      console.error("useAuthProvider - Error signing out:", err);
      
      // Force clear localStorage on error as a fallback
      try {
        localStorage.removeItem('sb-dvalgsvmkrqzwfcxvbxg-auth-token');
      } catch (e) {
        console.warn("Could not clear localStorage:", e);
      }
    }
  }, [sessionSignOut]);
  
  // Debug log to track session state changes
  useEffect(() => {
    console.log("useAuthProvider - Session state changed:", {
      hasSession: !!session,
      userEmail: session?.user?.email || "no user",
      userId: session?.user?.id,
      sessionLoading,
      adminLoading,
      sessionError: sessionError || "no error",
      adminError: adminError || "no error",
      isAdmin
    });
    
    // If we have no session but there appears to be data in localStorage,
    // attempt to refresh the session
    if (!session && !sessionLoading) {
      const sessionStr = localStorage.getItem('sb-dvalgsvmkrqzwfcxvbxg-auth-token');
      if (sessionStr) {
        console.log("useAuthProvider - Session missing but localStorage has data, attempting refresh");
        refreshSession();
      }
    }
  }, [session, sessionLoading, sessionError, isAdmin, adminLoading, adminError, refreshSession]);

  return {
    session,
    user: session?.user || null,
    loading: sessionLoading || adminLoading,
    signOut,
    isAdmin,
    error: sessionError || adminError,
    refreshSession
  };
}
