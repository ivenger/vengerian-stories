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
      // Debug RPC call details including headers
      const payload = { user_id: userId };
      
      // Get the current auth session synchronously to catch any auth errors
      let currentSession;
      try {
        const { data: authData } = await supabase.auth.getSession();
        currentSession = authData.session;
        console.log('Auth session retrieved:', {
          hasSession: !!currentSession,
          accessToken: currentSession?.access_token ? 'Present' : 'Missing'
        });
      } catch (authError) {
        console.error('Failed to get auth session:', authError);
        throw new Error('Auth session retrieval failed');
      }

      // Log the request we're about to make
      console.log('Preparing RPC call:', {
        url: `${supabase.getUrl()}/rest/v1/rpc/is_admin`,
        method: 'POST',
        payload: JSON.stringify(payload),
        headers: {
          Authorization: `Bearer ${currentSession?.access_token || 'MISSING'}`,
          apikey: supabase.supabaseKey,
          'Content-Type': 'application/json'
        }
      });

      // Make the RPC call with explicit error handling
      let rpcResponse;
      try {
        rpcResponse = await supabase.rpc('is_admin', payload);
        console.log('Raw RPC response:', rpcResponse);
      } catch (rpcError) {
        console.error('RPC call threw an exception:', rpcError);
        throw rpcError;
      }

      if (rpcResponse.error) {
        console.error('RPC call returned error:', {
          error: rpcResponse.error,
          status: rpcResponse.status,
          statusText: rpcResponse.statusText
        });
        throw new Error(JSON.stringify(rpcResponse.error, null, 2));
      }

      console.log('RPC call succeeded:', {
        data: rpcResponse.data,
        status: rpcResponse.status
      });

      return rpcResponse.data === true;
    } catch (err) {
      console.error("Failed to check user role:", {
        error: err,
        type: err?.constructor?.name,
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
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
