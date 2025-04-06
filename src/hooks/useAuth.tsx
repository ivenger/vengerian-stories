
import { useState, useEffect, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  
  // Clear any refresh timers
  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  // Fetch user roles
  const fetchUserRoles = useCallback(async (userId: string) => {
    if (!userId) return [];
    
    try {
      const { data, error } = await supabase.rpc('get_user_roles', { user_id: userId });
      if (error) throw error;
      return data.map((item: { role: string }) => item.role);
    } catch (err) {
      console.error('Error fetching roles:', err);
      return [];
    }
  }, []);

  // Check if user has a specific role
  const hasRole = useCallback((role: string) => {
    return userRoles.includes(role);
  }, [userRoles]);

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      toast({
        title: 'Signed in',
        description: 'Welcome back!'
      });
      
      return data;
    } catch (err: any) {
      console.error('Sign in failed:', err);
      toast({
        title: 'Sign in failed',
        description: err.message,
        variant: 'destructive'
      });
      throw err;
    }
  }, [toast]);

  // Sign up new user
  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) throw error;
      
      toast({
        title: 'Account created',
        description: 'Please check your email to confirm your account.'
      });
      
      return data;
    } catch (err: any) {
      console.error('Sign up failed:', err);
      toast({
        title: 'Sign up failed',
        description: err.message,
        variant: 'destructive'
      });
      throw err;
    }
  }, [toast]);

  // Refresh the session token
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Session refresh failed:', err);
      return false;
    }
  }, []);

  // Schedule the next token refresh
  const scheduleRefresh = useCallback((currentSession: Session) => {
    clearRefreshTimer();
    
    if (!currentSession?.expires_at) return;
    
    const expiresAt = currentSession.expires_at * 1000;
    const refreshBuffer = 5 * 60 * 1000; // 5 minutes before expiry
    const refreshTime = Math.max(expiresAt - refreshBuffer - Date.now(), 0);
    
    if (refreshTime <= 0) {
      // Refresh immediately if token is expired or about to expire
      refreshSession();
      return;
    }
    
    console.log(`Scheduling refresh in ${Math.round(refreshTime/1000)} seconds`);
    
    refreshTimerRef.current = setTimeout(async () => {
      const success = await refreshSession();
      // If refresh failed, try again soon
      if (!success) {
        refreshTimerRef.current = setTimeout(() => refreshSession(), 30 * 1000);
      }
    }, refreshTime);
  }, [clearRefreshTimer, refreshSession]);

  // Sign out the user
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      clearRefreshTimer();
      
      toast({
        title: 'Signed out',
        description: 'You\'ve been signed out successfully.'
      });
      
      return true;
    } catch (err) {
      console.error('Sign out failed:', err);
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive'
      });
      return false;
    }
  }, [clearRefreshTimer, toast]);

  // Initialize authentication
  useEffect(() => {
    let isMounted = true;
    
    const initAuth = async () => {
      setLoading(true);
      
      try {
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (!isMounted) return;
            
            console.log('Auth state changed:', event);
            
            if (newSession?.user) {
              setSession(newSession);
              setUser(newSession.user);
              
              // Fetch user roles
              const roles = await fetchUserRoles(newSession.user.id);
              if (isMounted) setUserRoles(roles);
              
              // Schedule token refresh
              scheduleRefresh(newSession);
              
              if (event === 'SIGNED_IN') {
                toast({
                  title: 'Welcome back!',
                  description: 'You\'ve successfully signed in.'
                });
              }
            } else {
              setSession(null);
              setUser(null);
              setUserRoles([]);
              clearRefreshTimer();
              
              if (event === 'SIGNED_OUT') {
                toast({
                  title: 'Signed out',
                  description: 'You\'ve been signed out successfully.'
                });
              }
            }
            
            setLoading(false);
          }
        );
        
        // Check for existing session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (currentSession?.user && isMounted) {
          setSession(currentSession);
          setUser(currentSession.user);
          const roles = await fetchUserRoles(currentSession.user.id);
          if (isMounted) setUserRoles(roles);
          scheduleRefresh(currentSession);
        }
        
        if (isMounted) setLoading(false);
        
        // Handle tab visibility for session verification
        const handleVisibilityChange = async () => {
          if (document.visibilityState === 'visible' && session) {
            try {
              // Try to refresh the session proactively
              await refreshSession();
            } catch (err) {
              console.error('Session verification failed:', err);
            }
          }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
          subscription.unsubscribe();
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      } catch (err: any) {
        console.error('Auth initialization failed:', err);
        if (isMounted) {
          setError(err.message || 'Authentication failed. Please refresh the page and try again.');
          setLoading(false);
        }
      }
      
      // Return an empty function as the cleanup function
      return () => {};
    };
    
    const cleanupPromise = initAuth();
    
    return () => {
      isMounted = false;
      clearRefreshTimer();
      
      // Handle async cleanup - fix the type issue here
      if (cleanupPromise && typeof cleanupPromise.then === 'function') {
        cleanupPromise.then((cleanupFn: any) => {
          if (typeof cleanupFn === 'function') {
            cleanupFn();
          }
        });
      }
    };
  }, [clearRefreshTimer, fetchUserRoles, refreshSession, scheduleRefresh, session, toast]);

  return {
    session,
    user,
    loading,
    userRoles,
    hasRole,
    error,
    signIn,
    signUp,
    signOut,
    refreshSession
  };
}
