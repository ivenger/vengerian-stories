
import { useState, useEffect, useCallback, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useAuthProvider() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const recoveryAttempts = useRef(0);
  const maxRecoveryAttempts = 3;

  const checkUserRole = useCallback(async (userId: string) => {
    if (!userId) return false;
    
    try {
      const { data, error } = await supabase.rpc('is_admin', { user_id: userId });
      
      if (error) {
        console.error("Error checking admin role:", error);
        return false;
      }
      
      return data === true;
    } catch (err) {
      console.error("Failed to check user role:", err);
      return false;
    }
  }, []);

  const recoverSession = useCallback(async () => {
    if (recoveryAttempts.current >= maxRecoveryAttempts) {
      console.log("Max recovery attempts reached");
      return false;
    }

    try {
      recoveryAttempts.current++;
      console.log(`Attempting session recovery (attempt ${recoveryAttempts.current})`);
      
      const { data: { session: recoveredSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Session recovery error:", error);
        return false;
      }

      if (recoveredSession?.user) {
        console.log("Session recovered successfully");
        setSession(recoveredSession);
        const adminStatus = await checkUserRole(recoveredSession.user.id);
        setIsAdmin(adminStatus);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error("Session recovery failed:", err);
      return false;
    }
  }, [checkUserRole]);

  // Handle auth state changes and session management
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    recoveryAttempts.current = 0;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event, newSession?.user?.email || "no user");

        if (!isMounted) return;

        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        }

        if (newSession?.user) {
          setSession(newSession);

          try {
            const adminStatus = await checkUserRole(newSession.user.id);
            if (isMounted) {
              setIsAdmin(adminStatus);
            }
          } catch (roleError) {
            console.error("Error checking admin status:", roleError);
            if (isMounted) setIsAdmin(false);
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setIsAdmin(false);
        } else if (!newSession && event !== 'SIGNED_OUT') {
          // Fix: Use proper type check instead of direct comparison
          const recoveryEvents = ['INITIAL_SESSION', 'PASSWORD_RECOVERY', 'MFA_CHALLENGE_VERIFIED', 'SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'];
          if (recoveryEvents.includes(event)) {
            // Possible connection issue - attempt recovery
            const recovered = await recoverSession();
            if (!recovered && isMounted) {
              setSession(null);
              setIsAdmin(false);
            }
          }
        }

        if (isMounted) setLoading(false);

        // Show toast for specific events
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

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session: currentSession }, error: sessionError }) => {
      if (!isMounted) return;

      if (sessionError) {
        console.error("Session error:", sessionError);
        setError("Failed to retrieve authentication session. Please check your network connection.");
        setLoading(false);
        return;
      }

      if (currentSession?.user) {
        console.log("Current session:", `exists for ${currentSession.user.email}`);
        setSession(currentSession);
        try {
          const adminStatus = await checkUserRole(currentSession.user.id);
          if (isMounted) {
            setIsAdmin(adminStatus);
          }
        } catch (roleError) {
          console.error("Error checking initial admin status:", roleError);
          if (isMounted) setIsAdmin(false);
        }
      } else {
        console.log("No active session found");
      }

      if (isMounted) setLoading(false);
    }).catch(err => {
      if (isMounted) {
        console.error("Failed to get session:", err);
        setError("Connection error. Please check your network and try again.");
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [toast, checkUserRole, recoverSession]);

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
    user: session?.user || null,
    loading,
    signOut,
    isAdmin,
    error
  };
}
