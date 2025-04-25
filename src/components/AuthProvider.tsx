import { ReactNode, useEffect, useRef } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useAuthProvider } from "../hooks/useAuthProvider";
import { useSessionRefresh } from "../hooks/filters/useSessionRefresh";
import { getAdminCache } from "../hooks/auth/useAdminCache";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuthProvider();
  const hasAttemptedRefreshRef = useRef<boolean>(false);
  const lastLoggedStateRef = useRef<string>("");
  
  // Initialize session refresh mechanism at the auth provider level
  const { refreshSession } = useSessionRefresh();

  // Log auth state for debugging, but only when it changes meaningfully
  useEffect(() => {
    const currentState = JSON.stringify({
      isAuthenticated: !!auth.user,
      userEmail: auth.user?.email,
      isAdmin: auth.isAdmin,
      userId: auth.user?.id,
      sessionStatus: auth.loading ? "loading" : !!auth.session ? "active" : "no session"
    });

    if (currentState !== lastLoggedStateRef.current) {
      console.log("AuthProvider - auth state:", JSON.parse(currentState));
      lastLoggedStateRef.current = currentState;
    }
  }, [auth.user, auth.isAdmin, auth.loading, auth.session]);

  // Attempt to refresh session when auth loading completes if no session is found
  useEffect(() => {
    if (!auth.loading && !auth.session && !hasAttemptedRefreshRef.current) {
      const sessionStr = localStorage.getItem('sb-dvalgsvmkrqzwfcxvbxg-auth-token');
      const cachedAdmin = auth.user?.id ? getAdminCache() : null;
      
      if (sessionStr && !hasAttemptedRefreshRef.current) {
        hasAttemptedRefreshRef.current = true;
        refreshSession().catch((err) => {
          console.error("AuthProvider - Error refreshing session:", err);
        });
      }
    }
  }, [auth.loading, auth.session, refreshSession, auth.user]);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};
