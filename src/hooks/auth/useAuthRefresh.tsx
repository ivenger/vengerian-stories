
import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

export function useAuthRefresh() {
  const refreshAttemptedRef = useRef<boolean>(false);
  const refreshTimeoutRef = useRef<number | null>(null);
  
  const refreshSession = useCallback(async () => {
    try {
      // Prevent multiple refresh attempts within a short period
      if (refreshAttemptedRef.current) {
        console.log("useAuthRefresh - Refresh already attempted recently, skipping");
        return null;
      }
      
      refreshAttemptedRef.current = true;
      
      console.log("useAuthRefresh - Manually refreshing session");
      const { data, error } = await supabase.auth.refreshSession();
      
      // Reset the flag after a delay
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      refreshTimeoutRef.current = window.setTimeout(() => {
        refreshAttemptedRef.current = false;
        refreshTimeoutRef.current = null;
      }, 10000);
      
      if (error) {
        console.error("useAuthRefresh - Failed to refresh session:", error);
        return null;
      } else if (data.session) {
        console.log("useAuthRefresh - Session refreshed successfully");
        return data.session;
      }
      return null;
    } catch (err) {
      console.error("useAuthRefresh - Error refreshing session:", err);
      return null;
    }
  }, []);

  return { refreshSession };
}
