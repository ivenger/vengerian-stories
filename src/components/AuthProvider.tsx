
import { ReactNode, useEffect, useRef } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useAuthProvider } from "../hooks/useAuthProvider";
import { useSessionRefresh } from "../hooks/filters/useSessionRefresh";
import { getAdminCache } from "../hooks/auth/useAdminCache";
import { debounce } from "lodash";

const DEBOUNCE_DELAY = 2000;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuthProvider();
  const hasAttemptedRefreshRef = useRef<boolean>(false);
  const lastLoggedStateRef = useRef<string>("");
  const lastSessionRef = useRef(auth.session);
  const { refreshSession } = useSessionRefresh();
  
  // Debounced logging of meaningful auth state changes
  const logAuthState = useRef(
    debounce((state: any) => {
      const stateString = JSON.stringify(state);
      if (stateString !== lastLoggedStateRef.current) {
        console.log("Auth state changed:", state.type, state.email);
        lastLoggedStateRef.current = stateString;
      }
    }, DEBOUNCE_DELAY)
  ).current;

  // Only log meaningful auth state changes
  useEffect(() => {
    // Skip if session hasn't actually changed
    if (auth.session === lastSessionRef.current) {
      return;
    }

    lastSessionRef.current = auth.session;
    
    const state = {
      type: 'INITIAL_SESSION',
      email: auth.user?.email || null
    };

    logAuthState(state);

    return () => {
      logAuthState.cancel();
    };
  }, [auth.session, auth.user?.email]);

  // Session refresh with deduplication
  useEffect(() => {
    const attemptSessionRefresh = async () => {
      if (!auth.loading && !auth.session && !hasAttemptedRefreshRef.current) {
        const sessionStr = localStorage.getItem('sb-dvalgsvmkrqzwfcxvbxg-auth-token');
        if (!sessionStr) return;

        try {
          const tokenData = JSON.parse(sessionStr);
          if (!tokenData?.access_token) return;

          hasAttemptedRefreshRef.current = true;
          await refreshSession();
        } catch (err) {
          console.error("Failed to refresh session:", err);
        }
      }
    };

    attemptSessionRefresh();
  }, [auth.loading, auth.session, refreshSession]);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};
