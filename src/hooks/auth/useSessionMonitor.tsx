import { useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';

interface SessionMonitorProps {
  session: any;
  user: User | null;
  sessionLoading: boolean;
  isAdmin: boolean;
  sessionError: string | null;
}

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

  useEffect(() => {
    const currentState = {
      hasSession: !!session,
      userEmail: session?.user?.email || null,
      userId: session?.user?.id || null,
      isAdmin,
      sessionLoading
    };

    // Only log if there's a meaningful change
    if (JSON.stringify(currentState) !== JSON.stringify(previousState.current)) {
      console.log("Session state changed:", {
        ...currentState,
        sessionError: sessionError || "no error"
      });
      
      previousState.current = currentState;
    }
  }, [session, sessionLoading, sessionError, isAdmin]);
}
