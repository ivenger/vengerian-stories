
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
      
      // Attempt session refresh with timeout
      const refreshPromise = supabase.auth.refreshSession();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Session refresh timeout')), 5000);
      });
      
      // Race the refresh against a timeout
      const result = await Promise.race([refreshPromise, timeoutPromise]) as any;
      
      if (result.data?.session) {
        console.log("Session recovered successfully");
        setSession(result.data.session);
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
      console.log("useSession - Signing out");
      
      // Create a timeout promise to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sign out timeout')), 5000);
      });
      
      // Race between the actual signOut and the timeout
      await Promise.race([
        supabase.auth.signOut(),
        timeoutPromise
      ]).catch(err => {
        console.error("Sign out timed out or failed:", err);
        // Force clear local storage as a fallback for timeout situations
        try {
          localStorage.removeItem('sb-dvalgsvmkrqzwfcxvbxg-auth-token');
        } catch (e) {
          console.warn("Could not clear localStorage:", e);
        }
      });
      
      // Always clear session state regardless of API success
      setSession(null);
      
      toast({
        title: "Signed out",
        description: "You've been signed out successfully.",
      });
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
