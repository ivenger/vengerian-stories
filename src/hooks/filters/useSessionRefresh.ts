import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function useSessionRefresh() {
  const refreshInProgressRef = useRef<boolean>(false);
  const lastRefreshTimeRef = useRef<number>(0);
  const refreshAttemptRef = useRef<number>(0);

  const refreshSession = useCallback(async () => {
    try {
      // Prevent concurrent refreshes
      if (refreshInProgressRef.current) {
        return null;
      }

      // Rate limit refresh attempts
      const now = Date.now();
      if (now - lastRefreshTimeRef.current < REFRESH_INTERVAL_MS) {
        return null;
      }

      refreshInProgressRef.current = true;
      lastRefreshTimeRef.current = now;

      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("Session refresh failed:", error.message);
        return null;
      }
      
      if (data?.session) {
        refreshAttemptRef.current = 0;
        return data.session;
      }

      return null;
    } catch (err) {
      console.error("Session refresh exception:", err);
      return null;
    } finally {
      refreshInProgressRef.current = false;
    }
  }, []);

  const getActiveSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        return null;
      }

      const now = Date.now();
      const expiresAt = session.expires_at ? new Date(session.expires_at * 1000) : null;
      const needsRefresh = expiresAt && (expiresAt.getTime() - now < 5 * 60 * 1000);

      if (needsRefresh) {
        return refreshSession();
      }

      return session;
    } catch (err) {
      console.error("Get active session error:", err);
      return null;
    }
  }, [refreshSession]);

  return {
    refreshSession,
    getActiveSession
  };
}
