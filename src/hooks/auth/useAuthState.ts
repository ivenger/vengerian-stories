
import { useState, useEffect, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { checkUserRole } from "./useAuthUtils";
import { useToast } from "@/hooks/use-toast";

export function useAuthState() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const isMountedRef = useRef(true);
  const initializingRef = useRef(false);
  const { toast } = useToast();

  // Set up auth state listener
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    
    const initializeAuth = async () => {
      // Prevent duplicate initialization
      if (initializingRef.current) {
        console.log("Auth initialization already in progress, skipping");
        return null;
      }
      
      if (!isMountedRef.current) {
        return null;
      }
      
      initializingRef.current = true;
      setLoading(true);
      setError(null);
      
      try {
        console.log("Setting up auth state listener (attempt " + (retryCount + 1) + ")");
        
        // Set up the auth state change listener first
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log("Auth state changed:", event, newSession?.user?.email || "no user");
            
            if (!isMountedRef.current) return;
            
            if (newSession?.user) {
              setSession(newSession);
              
              try {
                const adminStatus = await checkUserRole(newSession.user.id);
                if (isMountedRef.current) {
                  console.log("Setting admin status to:", adminStatus, "for user:", newSession.user.email);
                  setIsAdmin(adminStatus);
                }
              } catch (roleError) {
                console.error("Error checking admin status:", roleError);
                if (isMountedRef.current) setIsAdmin(false);
              }
            } else {
              setSession(null);
              setIsAdmin(false);
            }
            
            if (isMountedRef.current) {
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

        // Then check for existing session
        console.log("Checking for existing session");
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
          
        if (!isMountedRef.current) {
          subscription.unsubscribe();
          initializingRef.current = false;
          return null;
        }
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          throw sessionError;
        }
        
        console.log("Current session:", currentSession ? `exists for ${currentSession.user.email}` : "none");
        
        if (currentSession?.user) {
          setSession(currentSession);
          
          try {
            const adminStatus = await checkUserRole(currentSession.user.id);
            if (isMountedRef.current) {
              console.log("Setting initial admin status to:", adminStatus, "for user:", currentSession.user.email);
              setIsAdmin(adminStatus);
            }
          } catch (roleError) {
            console.error("Error checking initial admin status:", roleError);
            if (isMountedRef.current) setIsAdmin(false);
          }
        }
        
        if (isMountedRef.current) {
          setLoading(false);
          setAuthInitialized(true);
          setError(null);
        }
        
        initializingRef.current = false;
        
        // Return the cleanup function for the subscription
        return () => {
          subscription.unsubscribe();
        };
      } catch (err: any) {
        console.error("Auth initialization error:", err);
        
        if (isMountedRef.current) {
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying auth initialization (${retryCount}/${maxRetries})...`);
            initializingRef.current = false;
            
            // Use setTimeout to allow a retry, but make sure it doesn't get cleaned up
            // accidentally by returning a function instead of the setTimeout result
            setTimeout(() => {
              if (isMountedRef.current) {
                initializeAuth();
              }
            }, 1000 * retryCount);
            
            return () => {}; // Return empty cleanup for this case
          }
          
          setError("Failed to initialize authentication. Please refresh the page and try again.");
          setLoading(false);
          setAuthInitialized(true);
        }
        
        initializingRef.current = false;
        return () => {}; // Return empty cleanup for error case
      }
    };
    
    // Store the cleanup function returned by initializeAuth
    const cleanupPromise = initializeAuth();
    
    return () => {
      console.log("Cleaning up auth state listener");
      isMountedRef.current = false;
      
      // Handle the cleanup - we'll use Promise.resolve to handle both direct function returns and promises
      Promise.resolve(cleanupPromise).then(cleanupFn => {
        if (cleanupFn && typeof cleanupFn === 'function') {
          cleanupFn();
        }
      }).catch(err => {
        console.error("Error during auth cleanup:", err);
      });
    };
  }, [toast]);

  // Add tab visibility change handler to verify session
  useEffect(() => {
    if (!authInitialized || !isMountedRef.current) return;
    
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isMountedRef.current) {
        console.log("Tab became visible, verifying session");
        if (session && !loading) {
          try {
            // Verify the session is still valid
            const { data, error } = await supabase.auth.getSession();
            
            if (!isMountedRef.current) return;
            
            if (error) {
              console.error("Session verification error:", error);
              setError("Session verification failed. Please sign in again.");
              setSession(null);
              return;
            }
            
            if (data.session) {
              console.log("Session verified on tab focus");
              if (JSON.stringify(data.session) !== JSON.stringify(session)) {
                console.log("Session data changed, updating state");
                setSession(data.session);
              }
            } else if (session) {
              console.log("No valid session found on tab focus, but we had one before");
              setSession(null);
              setIsAdmin(false);
            }
          } catch (err) {
            console.error("Error verifying session:", err);
          }
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [authInitialized, session, loading]);

  // Track component lifecycle
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    session,
    user: session?.user || null,
    loading,
    isAdmin,
    error,
    authInitialized,
    setSession,
  };
}
