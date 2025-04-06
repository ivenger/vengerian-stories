
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
  const [user, setUser] = useState(session?.user || null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const isMountedRef = useRef(true);
  const { toast } = useToast();
  
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
        return { error };
      }
      
      toast({
        title: "Signed out",
        description: "You've been signed out successfully."
      });
      
      return { error: null };
    } catch (err: any) {
      console.error("Sign out exception:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      return { error: err };
    }
  }, [toast]);

  // Refresh session token
  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (!isMountedRef.current) return false;
    
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error("Session refresh failed:", error.message);
        return false;
      }
      return !!data.session;
    } catch (err) {
      console.error('Session refresh failed:', err);
      return false;
    }
  }, []);

  // Initialize authentication
  useEffect(() => {
    isMountedRef.current = true;
    
    const initAuth = async () => {
      if (!isMountedRef.current) return;
      setLoading(true);
      
      try {
        // Set up auth state change listener first
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (!isMountedRef.current) return;
            
            if (newSession?.user) {
              setSession(newSession);
              setUser(newSession.user);
              
              // Check admin status
              const adminStatus = await checkUserRole(newSession.user.id);
              if (isMountedRef.current) {
                setIsAdmin(adminStatus);
              }
              
              if (event === 'SIGNED_IN' && isMountedRef.current) {
                toast({
                  title: 'Welcome back!',
                  description: 'You\'ve successfully signed in.'
                });
              }
            } else {
              if (isMountedRef.current) {
                setSession(null);
                setUser(null);
                setIsAdmin(false);
              }
            }
            
            if (isMountedRef.current) {
              setLoading(false);
              setError(null);
              setAuthInitialized(true);
            }
          }
        );
        
        // Then check for existing session
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
          setUser(currentSession.user);
          
          // Check admin status
          const adminStatus = await checkUserRole(currentSession.user.id);
          if (isMountedRef.current) {
            setIsAdmin(adminStatus);
          }
        }
        
        // Syncing auth state across tabs
        window.addEventListener('storage', (event) => {
          if (event.key === 'supabase.auth.token' && isMountedRef.current) {
            refreshSession();
          }
        });
        
        // Handle tab visibility for session verification
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible' && isMountedRef.current) {
            refreshSession();
          }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Handle online status changes
        const handleOnline = () => {
          if (isMountedRef.current && session) {
            refreshSession();
          }
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
    };
  }, [refreshSession, toast]);

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
