import { useState, useEffect, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseRequest } from "@/hooks/useSupabaseRequest";

export function useAuthProvider() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  // Version hash to force logout on application rebuilds
  const APP_VERSION = Date.now().toString();
  const LAST_VERSION_KEY = 'app_version';

  const {
    execute: checkAdminRole
  } = useSupabaseRequest(
    async (userId: string) => {
      try {
        console.log("Checking admin role for user:", userId);
        const { data, error } = await supabase.rpc('is_admin', { user_id: userId });
        
        if (error) {
          console.error("Error checking admin role:", error);
          return false;
        }
        
        console.log("Admin check result - Value:", data, "Type:", typeof data);
        return data === true;
      } catch (err) {
        console.error("Failed to check user role:", err);
        return false;
      }
    },
    {
      maxAttempts: 2
    }
  );

  const {
    execute: refreshSession,
    loading: refreshing
  } = useSupabaseRequest(
    async () => {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        throw error;
      }
      if (data.session) {
        setSession(data.session);
        return true;
      }
      return false;
    },
    {
      maxAttempts: 3,
      onError: (error) => {
        console.error("Error refreshing session:", error);
        setSession(null);
      }
    }
  );

  // Handle auth state changes and session management
  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event, newSession?.user?.email || "no user");

        if (!mounted) return;

        if (newSession?.user) {
          setSession(newSession);

          try {
            const adminStatus = await checkAdminRole(newSession.user.id);
            if (mounted) {
              console.log("Setting admin status to:", adminStatus, "for user:", newSession.user.email);
              setIsAdmin(adminStatus);
            }
          } catch (roleError) {
            console.error("Error checking admin status:", roleError);
            if (mounted) setIsAdmin(false);
          }
        } else {
          setSession(null);
          setIsAdmin(false);
        }

        // Show toast for specific events
        if (event === 'SIGNED_IN') {
          toast({
            title: "Welcome back!",
            description: "You've successfully signed in."
          });
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: "Signed out",
            description: "You've been signed out successfully."
          });
        } else if (event === 'TOKEN_REFRESHED') {
          console.log("Auth token was refreshed");
        }
      }
    );

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (!mounted) return;

      if (currentSession?.user) {
        setSession(currentSession);
        const adminStatus = await checkAdminRole(currentSession.user.id);
        if (mounted) {
          setIsAdmin(adminStatus);
        }
      }
    });

    // Set up auto refresh interval
    const refreshInterval = setInterval(() => {
      if (session) {
        refreshSession();
      }
    }, 10 * 60 * 1000); // Refresh every 10 minutes

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [toast, refreshSession, checkAdminRole]);

  // Add focus event handler for session validation
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleFocus = async () => {
      if (session) {
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          
          if (!currentSession) {
            console.log("No active session found on focus, attempting refresh");
            const refreshed = await refreshSession();
            if (!refreshed) {
              console.log("Failed to refresh session, signing out");
              await signOut();
            }
          }
        } catch (err) {
          console.error("Error validating session on focus:", err);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [session, refreshSession]);

  const signOut = useCallback(async () => {
    try {
      setSession(null);
      setIsAdmin(false);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: "Signed out",
        description: "You've been signed out successfully."
      });
    } catch (err) {
      console.error("Error signing out:", err);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  return {
    session,
    user: session?.user || null,
    loading: refreshing,
    signOut,
    isAdmin,
    refreshSession
  };
}
