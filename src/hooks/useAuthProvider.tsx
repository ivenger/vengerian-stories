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

  // Version hash to force logout on application rebuilds - updated with timestamp on each build
  const APP_VERSION = Date.now().toString();
  const LAST_VERSION_KEY = 'app_version';

  const checkUserRole = async (userId: string) => {
    if (!userId) {
      console.log("No user ID provided for admin check");
      return false;
    }
    
    try {
      console.log("Checking admin role for user:", userId);
      
      // Log the exact RPC invocation details
      console.log("Invoking RPC function 'is_admin' with parameters:", { user_id: userId });

      // Make the RPC call to check if the user is an admin
      const { data, error } = await supabase.rpc('is_admin', { user_id: userId });
      if (error) {
        // Log error but don't throw - prevent authentication from breaking
        console.error("Error checking admin role:", error);
        console.error("RPC call details: user_id:", userId, "error code:", error.code, "message:", error.message);
        
        // Handle specific error cases
        if (error.code === '500') {
          console.error("Server error checking admin status. This may be due to a problem with the is_admin RPC function.");
        }
        
        // Default to non-admin on error rather than breaking authentication
        return false;
      }
      
      // Log the result of the RPC call
      console.log("RPC call result for 'is_admin':", { data, error });
      
      console.log("Admin check result:", data);
      return Boolean(data);
    } catch (err) {
      console.error("Failed to check user role:", err);
      console.error("Exception details: user_id:", userId, "error:", err);
      // Default to non-admin on error
      return false;
    }
  };

  // Refresh session helper function
  const refreshSession = useCallback(async () => {
    try {
      console.log("Manually refreshing session");
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error("Error refreshing session:", error);
        return false;
      }

      if (data.session) {
        console.log("Session refreshed successfully");
        setSession(data.session);
        return true;
      } else {
        console.log("No session returned from refresh");
        return false;
      }
    } catch (err) {
      console.error("Exception during session refresh:", err);
      return false;
    } finally {
      setLoading(false); // Ensure loading is reset
    }
  }, []);

  // Force sign out when app is rebuilt - disable this for OAuth debugging
  useEffect(() => {
    const storedVersion = localStorage.getItem(LAST_VERSION_KEY);
    
    console.log("App version check - Stored:", storedVersion, "Current:", APP_VERSION);
    
    localStorage.setItem(LAST_VERSION_KEY, APP_VERSION);
    
    // Comment out the forced logout for now to avoid issues with OAuth
  }, []);

  // Handle auth state changes and session management
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    console.log("Setting up auth state listener");
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event, newSession?.user?.email || "no user");

        if (!isMounted) return;

        if (newSession?.user) {
          setSession(newSession);

          try {
            const adminStatus = await checkUserRole(newSession.user.id);
            if (isMounted) {
              console.log("Setting admin status to:", adminStatus, "for user:", newSession.user.email);
              setIsAdmin(adminStatus);
            }
          } catch (roleError) {
            console.error("Error checking admin status:", roleError);
            if (isMounted) setIsAdmin(false); // Default to non-admin on error
          }
        } else {
          setSession(null);
          setIsAdmin(false);
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
        } else if (event === 'TOKEN_REFRESHED') {
          console.log("Auth token was refreshed");
        }
      }
    );

    console.log("Checking for existing session");
    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session: currentSession }, error: sessionError }) => {
      if (!isMounted) return;

      if (sessionError) {
        console.error("Session error:", sessionError);
        setError("Failed to retrieve authentication session. Please check your network connection.");
        setLoading(false);
        return;
      }

      console.log("Current session:", currentSession ? `exists for ${currentSession.user.email}` : "none");
      setSession(currentSession);

      if (currentSession?.user) {
        try {
          const adminStatus = await checkUserRole(currentSession.user.id);
          if (isMounted) {
            console.log("Setting initial admin status to:", adminStatus, "for user:", currentSession.user.email);
            setIsAdmin(adminStatus);
          }
        } catch (roleError) {
          console.error("Error checking initial admin status:", roleError);
          if (isMounted) setIsAdmin(false); // Default to non-admin on error
        }
      }

      if (isMounted) setLoading(false);
    }).catch(err => {
      if (isMounted) {
        console.error("Failed to get session:", err);
        setError("Connection error. Please check your network and try again.");
        setLoading(false);
      }
    });

    // Set up session refresh interval
    const refreshInterval = setInterval(() => {
      if (session) {
        console.log("Scheduled session refresh");
        refreshSession();
      }
    }, 10 * 60 * 1000); // Refresh every 10 minutes

    return () => {
      console.log("Cleaning up auth listener");
      isMounted = false;
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [toast, refreshSession]);

  const signOut = async () => {
    try {
      console.log("Attempting to sign out");
      
      // Clear local state first for better UX (feels faster)
      setSession(null);
      setIsAdmin(false);
      
      // Then perform the actual signout operation
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (signOutError) {
        console.error("Error signing out:", signOutError);
        toast({
          title: "Error",
          description: "Failed to sign out. Please try again.",
          variant: "destructive"
        });
      } else {
        console.log("Sign out successful");
        
        toast({
          title: "Signed out",
          description: "You've been signed out successfully.",
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
    error,
    refreshSession, // Export the refresh function so it can be called manually if needed
  };
}
