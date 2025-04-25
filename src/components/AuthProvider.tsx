import { ReactNode, useEffect, useRef } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useAuthProvider } from "../hooks/useAuthProvider";
import { useSessionRefresh } from "../hooks/filters/useSessionRefresh";
import { getAdminCache } from "../hooks/auth/useAdminCache";
import { debounce } from "lodash";

const DEBOUNCE_DELAY = 1000;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuthProvider();
  const hasAttemptedRefreshRef = useRef<boolean>(false);
  const lastLoggedStateRef = useRef<string>("");
  const authStateRef = useRef(auth);
  const { refreshSession } = useSessionRefresh();

  // Store current auth state in ref to avoid unnecessary effects
  useEffect(() => {
    authStateRef.current = auth;
  }, [auth]);

  // Debounced logging of auth state changes
  const logAuthState = useRef(
    debounce((newState: any) => {
      const stateString = JSON.stringify(newState);
      if (stateString !== lastLoggedStateRef.current) {
        lastLoggedStateRef.current = stateString;
        console.log("Auth state changed:", newState);
      }
    }, DEBOUNCE_DELAY)
  ).current;

  // Log meaningful auth state changes only
  useEffect(() => {
    const currentState = {
      type: 'INITIAL_SESSION',
      email: auth.user?.email || null
    };

    logAuthState(currentState);

    return () => {
      logAuthState.cancel();
    };
  }, [auth.user?.email]);

  // Session refresh with token verification
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
          console.error("Failed to parse or refresh session:", err);
        }
      }
    };

    attemptSessionRefresh();
  }, [auth.loading, auth.session, refreshSession]);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};
