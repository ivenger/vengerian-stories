
import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSessionRecovery() {
  const recoveryAttemptedRef = useRef<boolean>(false);

  const handleSessionRecovery = useCallback(async () => {
    try {
      // Prevent multiple recovery attempts
      if (recoveryAttemptedRef.current) {
        console.log("Session recovery already attempted, skipping");
        return false;
      }
      
      recoveryAttemptedRef.current = true;
      console.log("Attempting to recover session");
      
      // Check if we have auth data in localStorage
      const tokenData = localStorage.getItem('sb-dvalgsvmkrqzwfcxvbxg-auth-token');
      
      if (!tokenData) {
        console.log("No session data in localStorage to recover");
        return false;
      }
      
      // Attempt session refresh with timeout
      const refreshPromise = supabase.auth.refreshSession();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Session refresh timeout')), 10000);
      });
      
      // Race the refresh against a timeout
      const result = await Promise.race([refreshPromise, timeoutPromise]) as any;
      
      if (result.data?.session) {
        console.log("Session recovered successfully");
        return result.data.session;
      }
      
      return false;
    } catch (err) {
      console.error("Session recovery error:", err);
      return false;
    }
  }, []);

  return { handleSessionRecovery, recoveryAttemptedRef };
}
