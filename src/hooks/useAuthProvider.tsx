
import { useSession } from "./auth/useSession";
import { useAdminCheck } from "./auth/useAdminCheck";
import { useAuthRefresh } from "./auth/useAuthRefresh";
import { useSignOut } from "./auth/useSignOut";
import { useSessionMonitor } from "./auth/useSessionMonitor";
import { useEffect } from "react";

export function useAuthProvider() {
  const { 
    session, 
    loading: sessionLoading, 
    error: sessionError 
  } = useSession();
  
  const { isAdmin, loading: adminLoading, error: adminError } = useAdminCheck(session);
  const { refreshSession } = useAuthRefresh();
  const { signOut } = useSignOut();

  // Monitor session state changes
  useSessionMonitor({
    session,
    user: session?.user || null,
    sessionLoading,
    isAdmin,
    sessionError
  });

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      // Any cleanup will be handled in individual hooks
    };
  }, []);

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
