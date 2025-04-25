
import { ReactNode, useEffect, useRef } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useAuthProvider } from "../hooks/useAuthProvider";
import { useSessionRefresh } from "../hooks/filters/useSessionRefresh";
import { getAdminCache } from "../hooks/auth/useAdminCache";
import { debounce } from "lodash";

const DEBOUNCE_DELAY = 2000; // Increased debounce delay

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuthProvider();
  const hasAttemptedRefreshRef = useRef<boolean>(false);
  const lastLoggedStateRef = useRef<string>("");
  const authStateRef = useRef(auth);
  const { refreshSession } = useSessionRefresh();
  const initialLoadRef = useRef(true);

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
    // Skip initial render to reduce noise
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    
    const currentState = {
      type: auth.session ? 'ACTIVE_SESSION' : 'NO_SESSION',
      email: auth.user?.email || null,
      loading: auth.loading
    };

    logAuthState(currentState);

    return () => {
      logAuthState.cancel();
    };
  }, [auth.user?.email, auth.session, auth.loading, logAuthState]);

  // Session refresh with token verification - only runs once
  useEffect(() => {
    const attemptSessionRefresh = async () => {
      if (!auth.loading && !auth.session && !hasAttemptedRefreshRef.current) {
        const sessionStr = localStorage.getItem('sb-dvalgsvmkrqzwfcxvbxg-auth-token');
        if (!sessionStr) {
          console.log("AuthProvider: No stored token found, skipping refresh");
          return;
        }

        try {
          console.log("AuthProvider: Attempting to parse and refresh stored session");
          const tokenData = JSON.parse(sessionStr);
          if (!tokenData?.access_token) {
            console.log("AuthProvider: No access token in stored data");
            return;
          }

          hasAttemptedRefreshRef.current = true;
          await refreshSession();
          console.log("AuthProvider: Session refresh attempt completed");
        } catch (err) {
          console.error("AuthProvider: Failed to parse or refresh session:", err);
        }
      }
    };

    attemptSessionRefresh();
  }, [auth.loading, auth.session, refreshSession]);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};
