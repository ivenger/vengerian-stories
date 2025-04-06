import { useState, useEffect, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useAuthProvider() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const checkUserRole = async (userId: string) => {
    if (!userId) {
      console.log("No user ID provided for admin check");
      return false;
    }
    
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
  };

  const refreshSession = useCallback(async () => {
    if (!session?.user) return false;

    try {
      console.log("Refreshing session for user:", session.user.email);
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error("Error refreshing session:", error);
        // If we get an invalid refresh token error, clear the session
        if (error.message.includes('invalid refresh token')) {
          setSession(null);
          setIsAdmin(false);
        }
        return false;
      }

      if (data.session) {
        console.log("Session refreshed successfully");
        setSession(data.session);
        // Re-check admin status after refresh
        const adminStatus = await checkUserRole(data.session.user.id);
        setIsAdmin(adminStatus);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error("Exception during session refresh:", err);
      return false;
    }
  }, [session]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    console.log("Setting up auth state listener");
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event, newSession?.user?.email || "no user");

        if (!isMounted) return;

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
        } else {
          setSession(null);
          setIsAdmin(false);
        }

        setLoading(false);
      }
    );

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session: currentSession }, error: sessionError }) => {
      if (!isMounted) return;

      if (sessionError) {
        console.error("Session error:", sessionError);
        setError("Failed to retrieve authentication session");
        setLoading(false);
        return;
      }

      if (currentSession?.user) {
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
      }

      setLoading(false);
    });

    // Set up session refresh interval - every 4 minutes
    const refreshInterval = setInterval(() => {
      if (session) {
        refreshSession();
      }
    }, 4 * 60 * 1000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [refreshSession]);

  const signOut = async () => {
    try {
      setSession(null);
      setIsAdmin(false);
      
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
        description: "An unexpected error occurred",
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
    error,
    refreshSession,
  };
}
