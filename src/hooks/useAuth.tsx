
import { useState, useEffect, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { checkUserRole } from './auth/useAuthUtils';

export type SignOutResult = {
  error: Error | null;
};

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const refreshTimerRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const { toast } = useToast();
  
  // Clear any refresh timers
  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  // Refresh the session token
  const refreshSession = useCallback(async () => {
    if (!isMountedRef.current) return false;
    
    try {
      console.log("Attempting to refresh session");
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("Session refresh error:", error);
        return false;
      }
      
      if (data.session) {
        console.log("Session refresh successful");
        return true;
      } else {
        console.log("Session refresh returned no session");
        return false;
      }
    } catch (err) {
      console.error('Session refresh failed:', err);
      return false;
    }
  }, []);

  // Schedule the next token refresh
  const scheduleRefresh = useCallback((currentSession: Session | null) => {
    clearRefreshTimer();
    
    if (!currentSession?.expires_at) {
      console.log("No expiry time in session, not scheduling refresh");
      return;
    }
    
    const expiresAt = currentSession.expires_at * 1000;
    const refreshBuffer = 5 * 60 * 1000; // 5 minutes before expiry
    const refreshTime = Math.max(expiresAt - refreshBuffer - Date.now(), 0);
    
    console.log(`Scheduling refresh in ${Math.floor(refreshTime / 1000)}s, token expires in ${Math.floor((expiresAt - Date.now()) / 1000)}s`);
    
    if (refreshTime <= 0) {
      // Refresh immediately if token is expired or about to expire
      console.log("Token expired or about to expire, refreshing immediately");
      refreshSession();
      return;
    }
    
    refreshTimerRef.current = window.setTimeout(async () => {
      console.log("Executing scheduled token refresh");
      const success = await refreshSession();
      
      // If refresh failed, try again soon
      if (!success && isMountedRef.current) {
        console.log("Scheduled refresh failed, retrying in 30s");
        refreshTimerRef.current = window.setTimeout(() => refreshSession(), 30 * 1000);
      }
    }, refreshTime);
  }, [clearRefreshTimer, refreshSession]);

  // Sign out the user
  const signOut = useCallback(async () => {
    try {
      console.log("Attempting to sign out");
      
      // Clear session state first
      if (isMountedRef.current) {
        setSession(null);
        setUser(null);
        setIsAdmin(false);
      }
      
      // Clear refresh timer
      clearRefreshTimer();
      
      // Call Supabase sign out
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Error signing out:", error);
        toast({
          title: "Error",
          description: "Failed to sign out. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      console.log("Sign out successful");
      toast({
        title: "Signed out",
        description: "You've been signed out successfully."
      });
    } catch (err) {
      console.error("Sign out exception:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  }, [clearRefreshTimer, toast]);

  // Check admin status
  const checkAdminStatus = useCallback(async (userId: string) => {
    if (!userId || !isMountedRef.current) return false;
    
    try {
      console.log("Checking admin status for user:", userId);
      const isUserAdmin = await checkUserRole(userId);
      console.log("Admin check result:", isUserAdmin);
      return isUserAdmin;
    } catch (err) {
      console.error("Admin role check failed:", err);
      return false;
    }
  }, []);

  // Initialize authentication
  useEffect(() => {
    isMountedRef.current = true;
    console.log("Auth hook mounted");
    
    const initAuth = async () => {
      if (!isMountedRef.current) return;
      setLoading(true);
      
      try {
        console.log("Initializing auth...");
        
        // Check for existing session first
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error getting session:", sessionError);
          if (isMountedRef.current) {
            setError("Failed to retrieve session");
            setLoading(false);
          }
          return;
        }
        
        const currentSession = sessionData?.session;
        
        if (currentSession?.user && isMountedRef.current) {
          console.log("Found existing session");
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Check admin status
          const adminStatus = await checkAdminStatus(currentSession.user.id);
          if (isMountedRef.current) {
            setIsAdmin(adminStatus);
            scheduleRefresh(currentSession);
          }
        } else {
          console.log("No existing session found");
          if (isMountedRef.current) {
            setSession(null);
            setUser(null);
            setIsAdmin(false);
          }
        }
        
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (!isMountedRef.current) return;
            
            console.log('Auth state changed:', event);
            
            if (newSession?.user) {
              if (isMountedRef.current) {
                setSession(newSession);
                setUser(newSession.user);
              }
              
              // Check admin status
              const adminStatus = await checkAdminStatus(newSession.user.id);
              if (isMountedRef.current) {
                setIsAdmin(adminStatus);
                scheduleRefresh(newSession);
              }
              
              if (event === 'SIGNED_IN') {
                toast({
                  title: 'Welcome back!',
                  description: 'You\'ve successfully signed in.'
                });
              }
            } else {
              clearRefreshTimer();
              
              if (isMountedRef.current) {
                setSession(null);
                setUser(null);
                setIsAdmin(false);
              }
            }
            
            if (isMountedRef.current) {
              setLoading(false);
              setAuthInitialized(true);
            }
          }
        );
        
        // Handle tab visibility for session verification
        const handleVisibilityChange = async () => {
          if (!isMountedRef.current) return;
          
          if (document.visibilityState === 'visible' && session) {
            console.log("Tab became visible, verifying session");
            try {
              // Try to refresh the session proactively
              await refreshSession();
            } catch (err) {
              console.error('Session verification failed:', err);
            }
          }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Handle online status
        const handleOnline = () => {
          if (!isMountedRef.current) return;
          
          console.log('Network connection restored');
          if (session) refreshSession();
        };
        
        window.addEventListener('online', handleOnline);
        
        if (isMountedRef.current) {
          setLoading(false);
          setAuthInitialized(true);
        }
        
        return () => {
          subscription.unsubscribe();
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          window.removeEventListener('online', handleOnline);
        };
      } catch (err) {
        console.error('Auth initialization failed:', err);
        if (isMountedRef.current) {
          setError('Authentication failed. Please refresh the page and try again.');
          setLoading(false);
        }
      }
    };
    
    initAuth();
    
    return () => {
      console.log("Auth hook unmounting, cleaning up");
      isMountedRef.current = false;
      clearRefreshTimer();
    };
  }, [checkAdminStatus, clearRefreshTimer, refreshSession, scheduleRefresh, session, toast]);

  return {
    session,
    user,
    loading,
    isAdmin,
    error,
    signOut,
    refreshSession,
    authInitialized
  };
}
