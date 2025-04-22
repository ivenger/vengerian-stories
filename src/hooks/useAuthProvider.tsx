
import { useSession } from "./auth/useSession";
import { useAdminCheck } from "./auth/useAdminCheck";
import { useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAuthProvider() {
  const { session, loading: sessionLoading, error: sessionError, signOut } = useSession();
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
