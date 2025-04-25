
import { useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";

interface SessionMonitorProps {
  session: Session | null;
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
  useEffect(() => {
    console.log("Session state changed:", {
      hasSession: !!session,
      userEmail: session?.user?.email || "no user",
      userId: session?.user?.id,
      sessionLoading,
      isAdmin,
      sessionError: sessionError || "no error"
    });
  }, [session, sessionLoading, sessionError, isAdmin]);
}
