
import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSessionRecovery } from "./useSessionRecovery";

export function useInitialSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { handleSessionRecovery } = useSessionRecovery();

  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      try {
        console.log("useSession: Getting initial session");
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (sessionError) {
          console.error("Initial session error:", sessionError);
          setError("Failed to retrieve authentication session");
          
          // Try to recover session if initial load fails
          const recovered = await handleSessionRecovery();
          if (recovered) {
            setSession(recovered as Session);
          }
          setLoading(false);
          return;
        }

        console.log("Initial session loaded:", !!currentSession);
        setSession(currentSession);
        setLoading(false);
      } catch (err) {
        console.error("Initial session exception:", err);
        if (isMounted) {
          setError("An unexpected error occurred while retrieving your session");
          setLoading(false);
        }
      }
    };

    initSession();

    return () => {
      isMounted = false;
    };
  }, [toast, handleSessionRecovery]);

  return { session, loading, error, setSession, setLoading };
}
