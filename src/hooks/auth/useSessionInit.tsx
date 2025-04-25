
import { useState, useEffect, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSessionRecovery } from "./useSessionRecovery";

export function useSessionInit() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { handleSessionRecovery } = useSessionRecovery();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    console.log("useSession: Initializing auth state monitoring");

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event, newSession?.user?.email || "no user");

        if (!isMounted) return;

        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        }

        setSession(newSession);
        setLoading(false);

        if (event === 'SIGNED_IN') {
          toast({
            title: "Welcome back!",
            description: "You've successfully signed in.",
          });
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: "Signed out",
            description: "You've been signed out successfully.",
          });
        }
      }
    );

    // Initial session load
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

    // Set a timeout to force-end loading state if it gets stuck
    const loadingTimeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.warn("Auth loading state timed out, forcing completion");
        setLoading(false);
      }
    }, 8000);

    initSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(loadingTimeoutId);
    };
  }, [toast, handleSessionRecovery]);

  return { session, loading, error };
}
