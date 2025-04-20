
import { useState, useEffect, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Handle session refresh attempts
  const handleSessionRecovery = useCallback(async () => {
    try {
      console.log("Attempting to recover session");
      // Check if we have auth data in localStorage
      const tokenData = localStorage.getItem('sb-dvalgsvmkrqzwfcxvbxg-auth-token');
      
      if (!tokenData) {
        console.log("No session data in localStorage to recover");
        return false;
      }
      
      // Attempt session refresh
      const { data, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error("Failed to refresh session:", refreshError);
        return false;
      }
      
      if (data.session) {
        console.log("Session recovered successfully");
        setSession(data.session);
        setError(null);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error("Session recovery error:", err);
      return false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    console.log("useSession: Initializing auth state monitoring");

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
          if (!recovered) {
            setLoading(false);
          }
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
      subscription.unsubscribe();
    };
  }, [toast, handleSessionRecovery]);

  const signOut = async () => {
    try {
      setLoading(true);
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (signOutError) {
        console.error("Error signing out:", signOutError);
        toast({
          title: "Error",
          description: "Failed to sign out. Please try again.",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error("Sign out exception:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    session,
    loading,
    error,
    signOut,
  };
}
