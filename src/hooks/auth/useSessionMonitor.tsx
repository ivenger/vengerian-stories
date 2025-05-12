import { useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { debounce } from '../../lib/utils';

interface SessionMonitorProps {
  session: any;
  user: User | null;
  sessionLoading: boolean;
  isAdmin: boolean;
  sessionError: string | null;
}

const DEBOUNCE_DELAY = 2000; // Increased to 2 seconds to reduce frequency

export function useSessionMonitor({
  session,
  user,
  sessionLoading,
  isAdmin,
  sessionError
}: SessionMonitorProps) {
  // Track previous state to prevent unnecessary logs
  const previousState = useRef({
    hasSession: false,
    userEmail: null as string | null,
    userId: null as string | null,
    isAdmin: false,
    sessionLoading: true
  });

  // Add a counter to track consecutive identical states
  const consecutiveIdenticalStates = useRef(0);
  const maxConsecutiveStates = 3; // Stop logging after 3 identical states

  const logStateChange = useRef(
    debounce((newState: any) => {
      const prevStateStr = JSON.stringify(previousState.current);
      const newStateStr = JSON.stringify(newState);

      if (prevStateStr !== newStateStr) {
        // Reset counter when state changes
        consecutiveIdenticalStates.current = 0;
        
        console.log("Session state changed:", {
          ...newState,
          sessionError: sessionError || "no error"
        });
        previousState.current = newState;
      } else {
        // Increment counter for identical states
        consecutiveIdenticalStates.current++;
        
        // Only log if we haven't exceeded the max consecutive identical states
        if (consecutiveIdenticalStates.current <= maxConsecutiveStates) {
          console.log(`Session state unchanged (${consecutiveIdenticalStates.current}/${maxConsecutiveStates})`);
        }
      }
    }, DEBOUNCE_DELAY)
  ).current;

  useEffect(() => {
    // Only trigger check if we have relevant changes
    const userId = session?.user?.id;
    const userEmail = session?.user?.email;
    
    // Skip if both user ID and loading state are unchanged
    if (
      userId === previousState.current.userId && 
      sessionLoading === previousState.current.sessionLoading &&
      isAdmin === previousState.current.isAdmin
    ) {
      return;
    }

    const currentState = {
      hasSession: !!session,
      userEmail: userEmail || null,
      userId: userId || null,
      isAdmin,
      sessionLoading
    };

    logStateChange(currentState);

    return () => {
      logStateChange.cancel();
    };
  }, [session?.user?.id, session?.user?.email, isAdmin, sessionLoading, logStateChange]);

  return null;
}
