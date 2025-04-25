
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useInitialSession } from "./useInitialSession";
import { useSessionTimeout } from "./useSessionTimeout";

export function useSessionInit() {
  const { toast } = useToast();
  const { 
    session, 
    loading, 
    error, 
    setSession, 
    setLoading 
  } = useInitialSession();

  const handleTimeout = useCallback(() => {
    setLoading(false);
  }, [setLoading]);

  useSessionTimeout(loading, handleTimeout);

  // Set up auth state change listener
  supabase.auth.onAuthStateChange((event, newSession) => {
    console.log("Auth state changed:", event, newSession?.user?.email || "no user");

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
  });

  return { session, loading, error };
}
