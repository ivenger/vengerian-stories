import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

export function useAdminCheck(session: Session | null) {
  const [isAdmin, setIsAdmin] = useState(false);

  const checkUserRole = useCallback(async (userId: string) => {
    if (!userId) return false;

    try {
      console.log(`Checking admin role for user: ${userId}`);
      
      // Debug RPC call payload
      const payload = { user_id: userId };
      console.log('RPC call payload:', JSON.stringify(payload, null, 2));

      // Only use the RPC approach
      const { data: rpcData, error: rpcError } = await supabase.rpc('is_admin', payload);

      if (rpcError) {
        // Log detailed error information
        console.error('RPC admin check failed with error:', {
          message: rpcError.message,
          details: rpcError.details,
          hint: rpcError.hint,
          code: rpcError.code,
          fullError: JSON.stringify(rpcError, null, 2)
        });
        return false;
      }

      console.log(`RPC admin check result data:`, JSON.stringify(rpcData, null, 2));
      return rpcData === true;
    } catch (err) {
      console.error("Failed to check user role:", {
        error: err,
        stringified: JSON.stringify(err, null, 2)
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
