
import { useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook for managing session refresh functionality
 */
export const useSessionRefresh = () => {
  const refreshSession = useCallback(async () => {
    console.log(`[${new Date().toISOString()}] Attempting to refresh session`);
    try {
        const { error } = await supabase.auth.refreshSession();
        if (error) {
            console.error(`[${new Date().toISOString()}] Failed to refresh session:`, error);
            return false;
        }
        console.log(`[${new Date().toISOString()}] Session refreshed successfully`);
        return true;
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Error refreshing session:`, err);
        return false;
    }
  }, []);

  return { refreshSession };
};
