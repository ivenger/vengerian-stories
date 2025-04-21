
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

export function useAdminCheck(session: Session | null) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkUserRole = useCallback(async (userId: string) => {
    if (!userId) {
      console.log("Cannot check admin status: No user ID provided");
      return false;
    }

    console.log('=== Starting admin check ===');
    console.log(`Checking admin role for user: ${userId}`);
    
    try {
      // Get auth session for debugging
      const { data: authData } = await supabase.auth.getSession();
      const currentSession = authData.session;
      console.log("Auth session available:", !!currentSession);
      
      // Log the actual URL we're calling to diagnose any endpoint issues
      const supabaseUrl = getSupabaseUrl();
      console.log(`Supabase URL for RPC call: ${supabaseUrl}/rest/v1/rpc/is_admin`);
      
      // Make RPC call with explicit parameter naming
      const { data, error } = await supabase.rpc('is_admin', {
        user_id: userId
      });

      if (error) {
        // Enhanced error logging with all context
        console.error('RPC call failed:', {
          error,
          userId,
          hasSession: !!currentSession,
          accessToken: currentSession?.access_token ? 'Present' : 'Missing',
          endpoint: `${supabaseUrl}/rest/v1/rpc/is_admin`,
          functionCall: "is_admin",
          parameters: { user_id: userId }
        });
        
        // Throw with detailed message for easier debugging
        throw new Error(`Admin check failed: ${error.message} (Code: ${error.code})`);
      }

      // Log result
      console.log(`Admin check result for ${userId}:`, data);
      return data === true;
    } catch (err) {
      console.error("Failed to check user role:", err);
      setError(err instanceof Error ? err.message : "Unknown error checking admin role");
      return false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const checkAdminStatus = async () => {
      if (session?.user) {
        console.log("Checking admin status for user:", session.user.email);
        console.log("User ID for admin check:", session.user.id);
        
        try {
          const adminStatus = await checkUserRole(session.user.id);
          
          if (isMounted) {
            console.log(`Admin status result for ${session.user.email}:`, adminStatus);
            setIsAdmin(adminStatus);
            setLoading(false);
          }
        } catch (err) {
          if (isMounted) {
            console.error("Error in admin status check:", err);
            setIsAdmin(false);
            setError(err instanceof Error ? err.message : "Unknown error");
            setLoading(false);
          }
        }
      } else {
        if (isMounted) {
          console.log("No session available for admin check");
          setIsAdmin(false);
          setLoading(false);
        }
      }
    };

    checkAdminStatus();
    
    return () => {
      isMounted = false;
    };
  }, [session, checkUserRole]);

  return { isAdmin, error, loading };
}

// Use the constant directly from client file
const getSupabaseUrl = () => {
  return "https://dvalgsvmkrqzwfcxvbxg.supabase.co";
};
