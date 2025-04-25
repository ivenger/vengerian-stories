import { ReactNode, useEffect, useRef, useCallback } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useAuthProvider } from "../hooks/useAuthProvider";
import { useSessionRefresh } from "../hooks/filters/useSessionRefresh";
import { getAdminCache } from "../hooks/auth/useAdminCache";

const DEBOUNCE_DELAY = 500; // 500ms debounce for state updates

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuthProvider();
  const hasAttemptedRefreshRef = useRef<boolean>(false);
  const lastLoggedStateRef = useRef<string>("");
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const { refreshSession } = useSessionRefresh();

  // Debounced state logging
  const logAuthState = useCallback((state: any) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const stateString = JSON.stringify(state);
      if (stateString !== lastLoggedStateRef.current) {
        console.log("AuthProvider - auth state:", state);
        lastLoggedStateRef.current = stateString;
      }
    }, DEBOUNCE_DELAY);
  }, []);

  // Log auth state changes with debouncing
  useEffect(() => {
    const currentState = {
      isAuthenticated: !!auth.user,
      userEmail: auth.user?.email,
      isAdmin: auth.isAdmin,
      userId: auth.user?.id,
      sessionStatus: auth.loading ? "loading" : !!auth.session ? "active" : "no session"
    };

    logAuthState(currentState);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [auth.user?.id, auth.isAdmin, auth.loading, auth.session?.expires_at, logAuthState]);

  // Session refresh logic with deduplication
  useEffect(() => {
    const attemptSessionRefresh = async () => {
      if (!auth.loading && !auth.session && !hasAttemptedRefreshRef.current) {
        const sessionStr = localStorage.getItem('sb-dvalgsvmkrqzwfcxvbxg-auth-token');
        
        if (sessionStr && !hasAttemptedRefreshRef.current) {
          hasAttemptedRefreshRef.current = true;
          try {
            await refreshSession();
          } catch (err) {
            console.error("AuthProvider - Error refreshing session:", err);
          }
        }
      }
    };

    attemptSessionRefresh();
  }, [auth.loading, auth.session, refreshSession]);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};
