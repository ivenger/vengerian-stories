
import { useState, useEffect, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { checkUserRole } from "./auth/useAuthUtils";
import { useSessionManager } from "./auth/useSessionManager";
import { useAppVersion } from "./auth/useAppVersion";

export function useAuthProvider() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Use the extracted hooks
  useAppVersion();
  const { refreshSession, setupRefreshTimer, signOut: performSignOut } = useSessionManager();

  // Wrapper around refreshSession that updates local state
  const handleRefreshSession = useCallback(async () => {
    const success = await refreshSession();
    if (success && session) {
      setSession(session);
    }
    return success;
  }, [refreshSession, session]);

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
    const cleanupRefreshTimer = setupRefreshTimer(session, handleRefreshSession);

    return () => {
      console.log("Cleaning up auth listener");
      isMounted = false;
      subscription.unsubscribe();
      cleanupRefreshTimer();
    };
  }, [toast, handleRefreshSession, setupRefreshTimer, session]);

  const signOut = async () => {
    try {
      console.log("Attempting to sign out");
      
      // Clear local state first for better UX (feels faster)
      setSession(null);
      setIsAdmin(false);
      
      // Then perform the actual signout operation
      const { error: signOutError } = await performSignOut();
      
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
    refreshSession: handleRefreshSession, // Export the refresh function so it can be called manually if needed
  };
}
