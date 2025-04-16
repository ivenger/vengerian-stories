
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

export function useAdminCheck(session: Session | null) {
  const [isAdmin, setIsAdmin] = useState(false);

  const checkUserRole = useCallback(async (userId: string) => {
    if (!userId) return false;
    
    try {
      console.log(`Checking admin role for user: ${userId}`);
      
      // First try using the RPC approach
      const { data: rpcData, error: rpcError } = await supabase.rpc('is_admin', { 
        user_id: userId 
      });
      
      if (!rpcError) {
        console.log(`RPC admin check result:`, rpcData);
        return rpcData === true;
      }
      
      console.log(`RPC admin check failed, falling back to direct query: ${rpcError.message}`);
      
      // Fallback: Query the user_roles table directly
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
        
      if (rolesError) {
        console.error("Error checking user role via direct query:", rolesError);
        return false;
      }
      
      console.log(`Direct query admin check result:`, rolesData);
      return rolesData !== null;
    } catch (err) {
      console.error("Failed to check user role:", err);
      return false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (session?.user) {
      checkUserRole(session.user.id).then((adminStatus) => {
        if (isMounted) {
          setIsAdmin(adminStatus);
        }
      });
    } else {
      setIsAdmin(false);
    }

    return () => {
      isMounted = false;
    };
  }, [session, checkUserRole]);

  return isAdmin;
}
