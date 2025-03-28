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
  const [authInitialized, setAuthInitialized] = useState(false);
  const { toast } = useToast();
  
  useAppVersion();
  const { refreshSession, setupRefreshTimer, signOut: performSignOut } = useSessionManager();

  const handleRefreshSession = useCallback(async () => {
    try {
      const success = await refreshSession();
      if (success && session) {
        setSession(session);
      }
      return success;
    } catch (err) {
      console.error("Error in handleRefreshSession:", err);
      return false;
    }
  }, [refreshSession, session]);

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    
    const initializeAuth = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log("Setting up auth state listener (attempt " + (retryCount + 1) + ")");
        
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
                if (isMounted) setIsAdmin(false);
              }
            } else {
              setSession(null);
              setIsAdmin(false);
            }
            
            if (isMounted) {
              setLoading(false);
              setAuthInitialized(true);
            }
            
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
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
          
        if (!isMounted) return;
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          throw sessionError;
        }
        
        console.log("Current session:", currentSession ? `exists for ${currentSession.user.email}` : "none");
        
        if (currentSession?.user) {
          setSession(currentSession);
          
          try {
            const adminStatus = await checkUserRole(currentSession.user.id);
            if (isMounted) {
              console.log("Setting initial admin status to:", adminStatus, "for user:", currentSession.user.email);
              setIsAdmin(adminStatus);
            }
          } catch (roleError) {
            console.error("Error checking initial admin status:", roleError);
            if (isMounted) setIsAdmin(false);
          }
        }
        
        const cleanupRefreshTimer = setupRefreshTimer(currentSession, handleRefreshSession);
        
        if (isMounted) {
          setLoading(false);
          setAuthInitialized(true);
          setError(null);
        }
        
        return () => {
          subscription.unsubscribe();
          cleanupRefreshTimer();
        };
      } catch (err: any) {
        console.error("Auth initialization error:", err);
        
        if (isMounted) {
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying auth initialization (${retryCount}/${maxRetries})...`);
            return setTimeout(() => initializeAuth(), 1000 * retryCount);
          }
          
          setError("Failed to initialize authentication. Please refresh the page and try again.");
          setLoading(false);
          setAuthInitialized(true);
        }
        
        return () => {};
      }
    };
    
    const cleanup = initializeAuth();
    
    return () => {
      console.log("Cleaning up auth provider");
      isMounted = false;
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [toast, handleRefreshSession, setupRefreshTimer]);

  const signOut = async () => {
    try {
      console.log("Attempting to sign out");
      
      setSession(null);
      setIsAdmin(false);
      
      const { error } = await performSignOut();
      
      if (error) {
        console.error("Error signing out:", error);
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
    refreshSession: handleRefreshSession,
    authInitialized,
  };
}
