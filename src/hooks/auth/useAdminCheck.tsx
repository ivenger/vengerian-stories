import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

export function useAdminCheck(session: Session | null) {
  const [isAdmin, setIsAdmin] = useState(false);

  const checkUserRole = useCallback(async (userId: string) => {
    if (!userId) return false;

    try {
      console.log(`Checking admin role for user: ${userId}`);
      
      // Debug RPC call details including headers
      const payload = { user_id: userId };
      
      // Get the current auth session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      console.log('Attempting RPC call with:', {
        url: `${supabase.getUrl()}/rest/v1/rpc/is_admin`,
        payload,
        hasAuthSession: !!currentSession,
        authHeader: currentSession?.access_token ? 'Present' : 'Missing',
        headers: {
          ...supabase.headers,
          Authorization: `Bearer ${currentSession?.access_token || ''}`
        }
      });

      try {
        // Only use the RPC approach
        const rpcCall = await supabase.rpc('is_admin', payload);
        
        // Log the entire response for debugging
        console.log('RPC response:', {
          status: rpcCall.status,
          statusText: rpcCall.statusText,
          error: rpcCall.error ? {
            message: rpcCall.error.message,
            details: rpcCall.error.details,
            hint: rpcCall.error.hint,
            code: rpcCall.error.code
          } : null,
          data: rpcCall.data,
          rawResponse: rpcCall
        });

        if (rpcCall.error) {
          throw new Error(JSON.stringify({
            message: rpcCall.error.message,
            details: rpcCall.error.details,
            hint: rpcCall.error.hint,
            code: rpcCall.error.code
          }, null, 2));
        }

        return rpcCall.data === true;
      } catch (rpcError) {
        console.error('RPC call failed:', {
          error: rpcError,
          message: rpcError instanceof Error ? rpcError.message : String(rpcError),
          stack: rpcError instanceof Error ? rpcError.stack : undefined
        });
        throw rpcError;
      }
    } catch (err) {
      console.error("Failed to check user role:", {
        error: err,
        errorType: err?.constructor?.name,
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      });
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
