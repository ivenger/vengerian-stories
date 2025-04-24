
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSessionRefresh = () => {
  const refreshSession = useCallback(async () => {
    try {
      console.log("useSessionRefresh: Starting session refresh");
      
      // First check if we have a session stored in localStorage to debug issues
      const localStorageSession = localStorage.getItem('sb-dvalgsvmkrqzwfcxvbxg-auth-token');
      console.log("useSessionRefresh: localStorage session exists:", !!localStorageSession);
      
      // Attempt to refresh the session
      const { data, error } = await supabase.auth.refreshSession();
      
      // Log detailed information about the refresh attempt
      if (error) {
        console.error("useSessionRefresh: Failed to refresh session:", error.message, error);
        return null;
      }
      
      if (data?.session) {
        console.log("useSessionRefresh: Session successfully refreshed, user ID:", data.session.user.id);
        console.log("useSessionRefresh: Session expires at:", new Date(data.session.expires_at! * 1000).toISOString());
        return data.session;
      } else {
        console.warn("useSessionRefresh: No session after refresh attempt");
        return null;
      }
    } catch (err) {
      console.error("useSessionRefresh: Exception during session refresh:", err);
      return null;
    }
  }, []);

  const getActiveSession = useCallback(async () => {
    try {
      console.log("useSessionRefresh: Checking for active session");
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("useSessionRefresh: Error getting session:", error.message, error);
        return null;
      }
      
      if (data?.session) {
        const expiresAt = data.session.expires_at ? new Date(data.session.expires_at * 1000) : null;
        const isExpired = expiresAt ? new Date() > expiresAt : false;
        
        console.log("useSessionRefresh: Session found", {
          userId: data.session.user.id,
          expiresAt: expiresAt?.toISOString(),
          isExpired,
          remainingTime: expiresAt ? Math.floor((expiresAt.getTime() - Date.now()) / 1000) + " seconds" : "unknown"
        });
        
        if (isExpired) {
          console.log("useSessionRefresh: Session is expired, refreshing");
          return refreshSession();
        }
        
        return data.session;
      } else {
        console.warn("useSessionRefresh: No session found");
        return null;
      }
    } catch (err) {
      console.error("useSessionRefresh: Exception getting session:", err);
      return null;
    }
  }, [refreshSession]);

  return {
    refreshSession,
    getActiveSession
  };
};
