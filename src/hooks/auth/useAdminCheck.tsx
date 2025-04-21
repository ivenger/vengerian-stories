
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

export function useAdminCheck(session: Session | null) {
  const [isAdmin, setIsAdmin] = useState(false);

  const checkUserRole = useCallback(async (userId: string) => {
    if (!userId) return false;

    console.log('=== Starting admin check ===');
    console.log(`Checking admin role for user: ${userId}`);
    
    try {
      // Get auth session
      const { data: authData } = await supabase.auth.getSession();
      const currentSession = authData.session;
      
      // Make RPC call - ensure we're passing the userId parameter correctly
      const { data, error } = await supabase.rpc('is_admin', {
        user_id: userId
      });

      if (error) {
        console.error('RPC call failed:', {
          error,
          userId,
          hasSession: !!currentSession,
          accessToken: currentSession?.access_token ? 'Present' : 'Missing'
        });
        throw error;
      }

      return data === true;
    } catch (err) {
      console.error("Failed to check user role:", err);
      return false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const checkAdminStatus = async () => {
      if (session?.user) {
        console.log("Checking admin status for user:", session.user.email);
        console.log("User ID for admin check:", session.user.id);
        
        const adminStatus = await checkUserRole(session.user.id);
        
        if (isMounted) {
          console.log(`Admin status result for ${session.user.email}:`, adminStatus);
          setIsAdmin(adminStatus);
        }
      } else {
        if (isMounted) {
          console.log("No session available for admin check");
          setIsAdmin(false);
        }
      }
    };

    checkAdminStatus();
    
    return () => {
      isMounted = false;
    };
  }, [session, checkUserRole]);

  return isAdmin;
}

// Use the constant directly from client file
const getSupabaseUrl = () => {
  return "https://dvalgsvmkrqzwfcxvbxg.supabase.co";
};
