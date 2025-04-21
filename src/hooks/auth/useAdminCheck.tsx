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
      // Step 1: Get auth session
      console.log('Step 1: Getting auth session...');
      const { data: authData } = await supabase.auth.getSession();
      const currentSession = authData.session;
      console.log('Auth session retrieved:', {
        hasSession: !!currentSession,
        accessToken: currentSession?.access_token ? 'Present' : 'Missing',
        userId: currentSession?.user?.id
      });

      // Step 2: Prepare RPC call
      console.log('Step 2: Making RPC call...');
      const rpcCall = await supabase.rpc('is_admin', { 
        "user_id": userId  // Use named parameter to match PostgreSQL function
      });
      
      console.log('RPC response:', {
        status: rpcCall.status,
        error: rpcCall.error,
        data: rpcCall.data,
        hasResponse: !!rpcCall
      });

      if (rpcCall.error) {
        console.error('RPC call failed:', {
          error: rpcCall.error,
          status: rpcCall.status,
          statusText: rpcCall.statusText,
          message: rpcCall.error.message,
          details: rpcCall.error.details
        });
        throw rpcCall.error;
      }

      const isAdmin = rpcCall.data === true;
      console.log('RPC call result:', { isAdmin, rawData: rpcCall.data });
      return isAdmin;

    } catch (err) {
      console.error("Failed to check user role:", {
        error: err,
        type: err?.constructor?.name,
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      return false;
    } finally {
      console.log('=== Finished admin check ===');
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

// Import helper function from client file
const getSupabaseUrl = () => {
  // Try to use the helper function if available
  if (typeof supabase.getUrl === 'function') {
    return supabase.getUrl();
  }
  // Fallback to direct URL
  return "https://dvalgsvmkrqzwfcxvbxg.supabase.co";
};
