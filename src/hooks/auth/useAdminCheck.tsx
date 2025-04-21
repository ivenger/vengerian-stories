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
      const headers = await supabase.rpc('is_admin', {}).headers;
      
      console.log('RPC call details:', {
        endpoint: 'is_admin',
        url: `${supabase.getUrl()}/rest/v1/rpc/is_admin`,
        payload,
        headers
      });

      // Only use the RPC approach
      const rpcCall = await supabase.rpc('is_admin', payload);
      
      // Log the entire response for debugging
      console.log('RPC response:', {
        status: rpcCall.status,
        statusText: rpcCall.statusText,
        data: rpcCall.data,
        error: rpcCall.error
      });

      if (rpcCall.error) {
        // Log detailed error information
        console.error('RPC admin check failed:', {
          error: rpcCall.error,
          status: rpcCall.status,
          statusText: rpcCall.statusText,
          request: {
            url: `${supabase.getUrl()}/rest/v1/rpc/is_admin`,
            payload,
            headers
          }
        });
        return false;
      }

      console.log(`RPC admin check result:`, {
        data: rpcCall.data,
        type: typeof rpcCall.data
      });
      
      return rpcCall.data === true;
    } catch (err) {
      console.error("Failed to check user role:", {
        error: err,
        name: err instanceof Error ? err.name : 'Unknown',
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
