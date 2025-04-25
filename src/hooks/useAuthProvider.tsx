
import { useSession } from "./auth/useSession";
import { useAdminCheck } from "./auth/useAdminCheck";
import { useAuthRefresh } from "./auth/useAuthRefresh";
import { useSignOut } from "./auth/useSignOut";
import { useSessionMonitor } from "./auth/useSessionMonitor";
import { useEffect, useMemo, useRef } from "react";

export function useAuthProvider() {
  const { 
    session, 
    loading: sessionLoading, 
    error: sessionError 
  } = useSession();
  
  const sessionKey = useRef(session?.access_token || null);
  // Only update admin check when session changes or when initially loaded
  const shouldCheckAdmin = session?.access_token !== sessionKey.current;
  
  // Update the reference whenever we detect a change
  useEffect(() => {
    if (session?.access_token !== sessionKey.current) {
      console.log("Session token changed, updating admin status");
      sessionKey.current = session?.access_token || null;
    }
  }, [session?.access_token]);

  // Only check admin status when session actually changes
  const { isAdmin, loading: adminLoading, error: adminError } = useAdminCheck(session);
  const { refreshSession } = useAuthRefresh();
  const { signOut } = useSignOut();

  // Create memoized state object to prevent unnecessary re-renders
  const authState = useMemo(() => ({
    session,
    user: session?.user || null,
    loading: sessionLoading || adminLoading,
    signOut,
    isAdmin,
    error: sessionError || adminError,
    refreshSession
  }), [session, sessionLoading, adminLoading, signOut, isAdmin, sessionError, adminError, refreshSession]);

  // Monitor session state changes with less frequency
  useSessionMonitor({
    session,
    user: session?.user || null,
    sessionLoading,
    isAdmin,
    sessionError
  });

  return authState;
}
