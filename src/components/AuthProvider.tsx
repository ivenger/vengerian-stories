
import { ReactNode, useEffect } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useAuthProvider } from "../hooks/useAuthProvider";
import { useSessionRefresh } from "../hooks/filters/useSessionRefresh";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuthProvider();
  // Initialize session refresh mechanism at the auth provider level
  const { refreshSession } = useSessionRefresh();

  // Log auth state for debugging
  useEffect(() => {
    console.log("AuthProvider - auth state:", { 
      isAuthenticated: !!auth.user,
      userEmail: auth.user?.email,
      isAdmin: auth.isAdmin,
      userId: auth.user?.id,
      sessionStatus: auth.loading ? "loading" : !!auth.session ? "active" : "no session"
    });
  }, [auth.user, auth.isAdmin, auth.loading, auth.session]);

  // Attempt to refresh session when auth loading completes if no session is found
  // Add a flag to prevent multiple refresh attempts
  useEffect(() => {
    let hasAttemptedRefresh = false;

    if (!auth.loading && !auth.session && !hasAttemptedRefresh) {
      console.log("AuthProvider - No active session after loading, checking local storage");
      const sessionStr = localStorage.getItem('sb-dvalgsvmkrqzwfcxvbxg-auth-token');
      
      if (sessionStr && !hasAttemptedRefresh) {
        console.log("AuthProvider - Found session in localStorage, attempting refresh");
        hasAttemptedRefresh = true;
        refreshSession();
      }
    }

    return () => {
      hasAttemptedRefresh = false;
    };
  }, [auth.loading, auth.session, refreshSession]);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};
