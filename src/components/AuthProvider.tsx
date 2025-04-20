
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
      sessionStatus: auth.loading ? "loading" : !!auth.session ? "active" : "no session"
    });
  }, [auth.user, auth.isAdmin, auth.loading, auth.session]);

  // Attempt to refresh session when auth loading completes if no session is found
  useEffect(() => {
    if (!auth.loading && !auth.session) {
      console.log("AuthProvider - No active session after loading, checking local storage");
      const sessionStr = localStorage.getItem('sb-dvalgsvmkrqzwfcxvbxg-auth-token');
      
      if (sessionStr) {
        console.log("AuthProvider - Found session in localStorage, attempting refresh");
        refreshSession();
      }
    }
  }, [auth.loading, auth.session, refreshSession]);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};
