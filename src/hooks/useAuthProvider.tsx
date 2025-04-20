
import { useSession } from "./auth/useSession";
import { useAdminCheck } from "./auth/useAdminCheck";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAuthProvider() {
  const { session, loading, error, signOut } = useSession();
  const isAdmin = useAdminCheck(session);
  
  // Debug log to track session state changes
  useEffect(() => {
    console.log("useAuthProvider - Session state changed:", {
      hasSession: !!session,
      userEmail: session?.user?.email || "no user",
      loading,
      error: error || "no error",
      isAdmin
    });
    
    // If we have no session but there appears to be data in localStorage,
    // attempt to refresh the session
    if (!session && !loading) {
      const sessionStr = localStorage.getItem('sb-dvalgsvmkrqzwfcxvbxg-auth-token');
      if (sessionStr) {
        console.log("useAuthProvider - Session missing but localStorage has data, attempting refresh");
        supabase.auth.refreshSession().then(({ data, error }) => {
          if (error) {
            console.error("useAuthProvider - Failed to refresh session:", error);
          } else if (data.session) {
            console.log("useAuthProvider - Session refreshed successfully");
          }
        });
      }
    }
  }, [session, loading, error, isAdmin]);

  return {
    session,
    user: session?.user || null,
    loading,
    signOut,
    isAdmin,
    error
  };
}
