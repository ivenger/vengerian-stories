
import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes cache TTL

export function useSessionRefresh() {
  const refreshInProgressRef = useRef<boolean>(false);
  const lastRefreshTimeRef = useRef<number>(0);
  const refreshAttemptRef = useRef<number>(0);
  const sessionCacheRef = useRef<{time: number, session: any}|null>(null);

  const refreshSession = useCallback(async () => {
    try {
      // Prevent concurrent refreshes
      if (refreshInProgressRef.current) {
        console.log("Session refresh: Already in progress, skipping");
        return null;
      }

      // Rate limit refresh attempts
      const now = Date.now();
      if (now - lastRefreshTimeRef.current < REFRESH_INTERVAL_MS) {
        console.log(`Session refresh: Rate limited (${Math.round((now - lastRefreshTimeRef.current) / 1000)}s < ${REFRESH_INTERVAL_MS / 1000}s)`);
        return null;
      }

      refreshInProgressRef.current = true;
      lastRefreshTimeRef.current = now;
      console.log("Session refresh: Starting refresh");

      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("Session refresh failed:", error.message);
        return null;
      }
      
      if (data?.session) {
        console.log("Session refresh: Success");
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
    const now = Date.now();
    
    // Return cached session if valid
    if (sessionCacheRef.current && (now - sessionCacheRef.current.time) < CACHE_TTL) {
      console.log("Session: Using cached session");
      return sessionCacheRef.current.session;
    }
    
    try {
      console.log("Session: Fetching active session");
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.log("Session: No valid session found");
        sessionCacheRef.current = { time: now, session: null };
        return null;
      }

      const expiresAt = session.expires_at ? new Date(session.expires_at * 1000) : null;
      const needsRefresh = expiresAt && (expiresAt.getTime() - now < 5 * 60 * 1000);

      if (needsRefresh) {
        console.log("Session: Needs refresh");
        const refreshedSession = await refreshSession();
        sessionCacheRef.current = { time: now, session: refreshedSession };
        return refreshedSession;
      }

      console.log("Session: Valid session retrieved");
      sessionCacheRef.current = { time: now, session };
      return session;
    } catch (err) {
      console.error("Get active session error:", err);
      sessionCacheRef.current = { time: now, session: null };
      return null;
    }
  }, [refreshSession]);

  return {
    refreshSession,
    getActiveSession
  };
}
