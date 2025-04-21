
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

      // Step 2: Prepare payload
      console.log('Step 2: Preparing RPC payload...');
      const payload = { user_id: userId };
      console.log('Payload:', payload);

      // Step 3: Get Supabase client info
      console.log('Step 3: Getting Supabase client info...');
      let baseUrl;
      try {
        baseUrl = supabase.getUrl();
        console.log('Supabase base URL:', baseUrl);
      } catch (urlError) {
        console.error('Failed to get Supabase URL:', {
          error: urlError,
          supabaseClient: !!supabase,
          supabaseProperties: Object.keys(supabase)
        });
        throw urlError;
      }

      // Step 4: Make RPC call - Fix headers position in the options
      console.log('Step 5: Making RPC call...');
      let rpcResponse;
      try {
        console.log('Calling supabase.rpc with:', {
          functionName: 'is_admin',
          payload,
          clientConfig: {
            url: baseUrl,
            hasAuth: !!currentSession?.access_token
          }
        });
        
        // The correct way to call RPC without passing headers in the wrong location
        rpcResponse = await supabase.rpc('is_admin', payload);
        
        console.log('RPC raw response:', {
          status: rpcResponse.status,
          error: rpcResponse.error,
          data: rpcResponse.data,
          hasResponse: !!rpcResponse
        });
      } catch (rpcError) {
        console.error('RPC call threw an exception:', {
          error: rpcError,
          message: rpcError instanceof Error ? rpcError.message : String(rpcError),
          stack: rpcError instanceof Error ? rpcError.stack : undefined,
          type: rpcError?.constructor?.name
        });
        throw rpcError;
      }

      // Step 6: Process response
      console.log('Step 6: Processing response...');
      if (rpcResponse.error) {
        console.error('RPC call returned error:', {
          error: rpcResponse.error,
          status: rpcResponse.status,
          statusText: rpcResponse.statusText,
          errorMessage: rpcResponse.error.message,
          errorDetails: rpcResponse.error.details
        });
        throw rpcResponse.error;
      }

      const isAdmin = rpcResponse.data === true;
      console.log('RPC call result:', { isAdmin, rawData: rpcResponse.data });
      return isAdmin;

    } catch (err) {
      console.error("Failed to check user role:", {
        error: err,
        type: err?.constructor?.name,
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        supabaseClientState: {
          hasClient: !!supabase,
          functions: Object.keys(supabase).filter(k => typeof supabase[k] === 'function')
        }
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
