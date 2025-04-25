import { useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { debounce } from 'lodash';

interface SessionMonitorProps {
  session: any;
  user: User | null;
  sessionLoading: boolean;
  isAdmin: boolean;
  sessionError: string | null;
}

const DEBOUNCE_DELAY = 1000; // Increased to 1 second

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

  const logStateChange = useRef(
    debounce((newState: any) => {
      const prevStateStr = JSON.stringify(previousState.current);
      const newStateStr = JSON.stringify(newState);

      if (prevStateStr !== newStateStr) {
        console.log("Session state changed:", {
          ...newState,
          sessionError: sessionError || "no error"
        });
        previousState.current = newState;
      }
    }, DEBOUNCE_DELAY)
  ).current;

  useEffect(() => {
    const currentState = {
      hasSession: !!session,
      userEmail: session?.user?.email || null,
      userId: session?.user?.id || null,
      isAdmin,
      sessionLoading
    };

    logStateChange(currentState);

    return () => {
      logStateChange.cancel();
    };
  }, [session?.user?.id, isAdmin, sessionLoading]);

  return null;
}
