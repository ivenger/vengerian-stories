import { useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';

interface SessionMonitorProps {
  session: any;
  user: User | null;
  sessionLoading: boolean;
  isAdmin: boolean;
  sessionError: string | null;
}

const DEBOUNCE_DELAY = 500; // 500ms debounce

export function useSessionMonitor({
  session,
  user,
  sessionLoading,
  isAdmin,
  sessionError
}: SessionMonitorProps) {
  const previousState = useRef({
    hasSession: false,
    userEmail: null as string | null,
    userId: null as string | null,
    isAdmin: false,
    sessionLoading: true
  });
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip the first render to avoid unnecessary state updates
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce the state update
    debounceTimerRef.current = setTimeout(() => {
      const currentState = {
        hasSession: !!session,
        userEmail: session?.user?.email || null,
        userId: session?.user?.id || null,
        isAdmin,
        sessionLoading
      };

      // Deep comparison of states
      const prevStateStr = JSON.stringify(previousState.current);
      const currentStateStr = JSON.stringify(currentState);

      // Only log if there's a meaningful change
      if (prevStateStr !== currentStateStr) {
        console.log("Session state changed:", {
          ...currentState,
          sessionError: sessionError || "no error"
        });
        
        previousState.current = currentState;
      }
    }, DEBOUNCE_DELAY);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [session?.user?.id, session?.expires_at, sessionLoading, sessionError, isAdmin]);
}
