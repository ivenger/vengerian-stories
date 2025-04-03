
import { useState, useEffect, useCallback, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { checkUserRole } from './auth/useAuthUtils';

export type SignOutResult = {
  error: Error | null;
};

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const refreshTimerRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const { toast } = useToast();
  
  // Clear refresh timer on unmount
  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  // Refresh session token
  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (!isMountedRef.current) return false;
    
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) return false;
      return !!data.session;
    } catch (err) {
      console.error('Session refresh failed:', err);
      return false;
    }
  }, []);

  // Schedule next token refresh
  const scheduleRefresh = useCallback((currentSession: Session | null) => {
    clearRefreshTimer();
    
    if (!currentSession?.expires_at) return;
    
    const expiresAt = currentSession.expires_at * 1000; // Convert to milliseconds
    const refreshBuffer = 5 * 60 * 1000; // 5 minutes before expiry
    const refreshTime = Math.max(expiresAt - refreshBuffer - Date.now(), 0);
    
    if (refreshTime <= 0) {
      // Refresh immediately if token is expired or about to expire
      refreshSession();
      return;
    }
    
    refreshTimerRef.current = window.setTimeout(async () => {
      const success = await refreshSession();
      
      // If refresh failed, try again soon
      if (!success && isMountedRef.current) {
        refreshTimerRef.current = window.setTimeout(() => refreshSession(), 30 * 1000);
      }
    }, refreshTime);
  }, [clearRefreshTimer, refreshSession]);

  // Sign out the user
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to sign out. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
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
  }, [toast]);

  // Initialize authentication
  useEffect(() => {
    isMountedRef.current = true;
    
    const initAuth = async () => {
      if (!isMountedRef.current) return;
      setLoading(true);
      
      try {
        // Get existing session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          if (isMountedRef.current) {
            setError("Failed to retrieve session");
            setLoading(false);
          }
          return;
        }
        
        const currentSession = sessionData?.session;
        
        if (currentSession?.user && isMountedRef.current) {
          setSession(currentSession);
          
          // Check admin status
          const adminStatus = await checkUserRole(currentSession.user.id);
          if (isMountedRef.current) {
            setIsAdmin(adminStatus);
            scheduleRefresh(currentSession);
          }
        } else if (isMountedRef.current) {
          setSession(null);
          setIsAdmin(false);
        }
        
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (!isMountedRef.current) return;
            
            if (newSession?.user) {
              setSession(newSession);
              
              // Check admin status
              const adminStatus = await checkUserRole(newSession.user.id);
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
            try {
              await refreshSession();
            } catch (err) {
              console.error('Session verification failed:', err);
            }
          }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Handle online status changes
        const handleOnline = () => {
          if (!isMountedRef.current) return;
          
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
      isMountedRef.current = false;
      clearRefreshTimer();
    };
  }, [clearRefreshTimer, refreshSession, scheduleRefresh, session, toast]);

  return {
    session,
    user: session?.user || null,
    loading,
    isAdmin,
    error,
    signOut,
    refreshSession,
    authInitialized
  };
}
