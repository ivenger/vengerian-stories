
import { useReducer, useEffect, useCallback, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { checkUserRole } from './auth/useAuthUtils';

// Define types for our state and actions
export type AuthState = {
  session: Session | null;
  user: Session['user'] | null;
  loading: boolean;
  isAdmin: boolean;
  error: string | null;
  authInitialized: boolean;
};

type AuthAction =
  | { type: 'AUTH_INITIALIZED'; payload?: { session: Session | null } }
  | { type: 'AUTH_LOADING'; payload?: boolean }
  | { type: 'AUTH_SUCCESS'; payload: { session: Session } }
  | { type: 'AUTH_UPDATED'; payload: { session: Session | null; isAdmin?: boolean } }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'SET_ADMIN'; payload: boolean }
  | { type: 'CLEAR_ERROR' };

// Initial state for our reducer
const initialState: AuthState = {
  session: null,
  user: null,
  loading: true,
  isAdmin: false,
  error: null,
  authInitialized: false,
};

// Reducer function to handle auth state changes
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_INITIALIZED':
      return {
        ...state,
        authInitialized: true,
        loading: false,
        session: action.payload?.session || null,
        user: action.payload?.session?.user || null,
      };
    case 'AUTH_LOADING':
      return {
        ...state,
        loading: action.payload !== undefined ? action.payload : true,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        session: action.payload.session,
        user: action.payload.session.user,
        loading: false,
        error: null,
      };
    case 'AUTH_UPDATED':
      return {
        ...state,
        session: action.payload.session,
        user: action.payload.session?.user || null,
        isAdmin: action.payload.isAdmin !== undefined ? action.payload.isAdmin : state.isAdmin,
        loading: false,
        error: null,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        session: null,
        user: null,
        isAdmin: false,
        loading: false,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case 'SET_ADMIN':
      return {
        ...state,
        isAdmin: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

export type SignOutResult = {
  error: Error | null;
};

export function useAuth() {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { toast } = useToast();
  const isMountedRef = useRef(true);
  
  // Schedule regular session refreshes
  const refreshSessionTimer = useRef<number | null>(null);
  
  // Refresh session - with improved error handling and retry logic
  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (!isMountedRef.current) return false;
    
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.warn("Session refresh failed:", error.message);
        return false;
      }
      
      if (data.session) {
        // Only update if component is still mounted
        if (isMountedRef.current) {
          dispatch({ type: 'AUTH_SUCCESS', payload: { session: data.session } });
          
          // Check admin status after successful refresh
          const adminStatus = await checkUserRole(data.session.user.id);
          if (isMountedRef.current) {
            dispatch({ type: 'SET_ADMIN', payload: adminStatus });
          }
        }
        return true;
      } else {
        if (isMountedRef.current && state.session) {
          // If we had a session but now don't, log the user out
          dispatch({ type: 'AUTH_LOGOUT' });
        }
        return false;
      }
    } catch (err) {
      console.error('Session refresh error:', err);
      return false;
    }
  }, [state.session]);

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
      
      if (isMountedRef.current) {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
      
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

  // Schedule periodic session refreshes
  const scheduleSessionRefresh = useCallback(() => {
    if (refreshSessionTimer.current) {
      window.clearTimeout(refreshSessionTimer.current);
    }

    // Refresh session every 10 minutes
    refreshSessionTimer.current = window.setTimeout(async () => {
      const success = await refreshSession();
      if (success && isMountedRef.current) {
        scheduleSessionRefresh();
      } else if (isMountedRef.current) {
        // If refresh failed, try again in 30 seconds
        refreshSessionTimer.current = window.setTimeout(() => {
          refreshSession().then(success => {
            if (success && isMountedRef.current) scheduleSessionRefresh();
          });
        }, 30000); // 30 seconds
      }
    }, 10 * 60 * 1000); // 10 minutes
  }, [refreshSession]);

  // Initialize authentication
  useEffect(() => {
    isMountedRef.current = true;
    
    const initAuth = async () => {
      if (!isMountedRef.current) return;
      dispatch({ type: 'AUTH_LOADING' });
      
      try {
        // Set up auth state change listener first to avoid race conditions
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (!isMountedRef.current) return;
            
            console.log("Auth state change event:", event);
            
            if (newSession?.user) {
              // Check admin status
              const adminStatus = await checkUserRole(newSession.user.id);
              
              if (isMountedRef.current) {
                dispatch({ 
                  type: 'AUTH_UPDATED', 
                  payload: { 
                    session: newSession,
                    isAdmin: adminStatus
                  } 
                });
                
                // Show welcome toast for sign in events
                if (event === 'SIGNED_IN') {
                  toast({
                    title: 'Welcome back!',
                    description: 'You\'ve successfully signed in.'
                  });
                  
                  // Schedule session refreshes after successful sign in
                  scheduleSessionRefresh();
                }
              }
            } else {
              if (isMountedRef.current) {
                dispatch({ type: 'AUTH_LOGOUT' });
              }
            }
          }
        );
        
        // Then check for existing session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          if (isMountedRef.current) {
            dispatch({ 
              type: 'AUTH_ERROR', 
              payload: "Failed to retrieve session" 
            });
          }
          return;
        }
        
        const currentSession = sessionData?.session;
        
        if (currentSession?.user && isMountedRef.current) {
          // Check admin status
          const adminStatus = await checkUserRole(currentSession.user.id);
          
          if (isMountedRef.current) {
            dispatch({ 
              type: 'AUTH_UPDATED', 
              payload: { 
                session: currentSession,
                isAdmin: adminStatus
              } 
            });
            
            // Schedule session refreshes if we have an active session
            scheduleSessionRefresh();
          }
        }
        
        // Synchronize auth state across tabs
        const handleStorageChange = (event: StorageEvent) => {
          if (event.key === 'supabase.auth.token') {
            console.log('Auth token changed in another tab');
            if (isMountedRef.current) {
              // Use setTimeout to avoid potential race conditions
              setTimeout(() => {
                if (isMountedRef.current) {
                  refreshSession();
                }
              }, 0);
            }
          }
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        // Handle tab visibility for session verification
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible' && isMountedRef.current && state.user) {
            refreshSession();
          }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Handle online status changes
        const handleOnline = () => {
          if (isMountedRef.current && state.user) {
            console.log('Network is online, refreshing session');
            refreshSession();
          }
        };
        
        window.addEventListener('online', handleOnline);
        
        if (isMountedRef.current) {
          // Mark auth as initialized regardless of whether we have a session
          dispatch({ 
            type: 'AUTH_INITIALIZED', 
            payload: { session: currentSession } 
          });
        }
        
        return () => {
          subscription.unsubscribe();
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('storage', handleStorageChange);
        };
      } catch (err) {
        console.error('Auth initialization failed:', err);
        if (isMountedRef.current) {
          dispatch({ 
            type: 'AUTH_ERROR', 
            payload: 'Authentication failed. Please refresh the page and try again.' 
          });
        }
      }
    };
    
    initAuth();
    
    return () => {
      isMountedRef.current = false;
      
      // Clear any scheduled refreshes when unmounting
      if (refreshSessionTimer.current) {
        window.clearTimeout(refreshSessionTimer.current);
      }
    };
  }, [toast, refreshSession, scheduleSessionRefresh]);

  return {
    session: state.session,
    user: state.user,
    loading: state.loading,
    isAdmin: state.isAdmin,
    error: state.error,
    signOut,
    refreshSession,
    authInitialized: state.authInitialized
  };
}
