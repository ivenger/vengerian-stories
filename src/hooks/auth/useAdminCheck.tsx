import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAdminCheck(session: Session | null) {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const checkUserRole = async () => {
      // Reset state on every check
      if (isMounted) {
        setLoading(true);
        setError(null);
      }
      
      // No session means not an admin
      if (!session?.user?.id) {
        if (isMounted) {
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }

      try {
        // First try using the user_roles table directly
        console.log("[AdminCheck] Querying user_roles for user:", session.user.id, session.user.email);
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id);

        console.log("[AdminCheck] user_roles query result:", { roles, rolesError });

        // If we can query the roles table directly
        if (!rolesError && roles) {
          const adminRole = roles.find(role => role.role === 'admin');
          console.log("[AdminCheck] Found roles:", roles, "Admin role present:", !!adminRole);
          if (isMounted) {
            setIsAdmin(!!adminRole);
            setLoading(false);
          }
          console.log("[AdminCheck] Admin status result for", session.user.email, ":", !!adminRole);
          return;
        }

        // If the first approach failed, log why
        console.error("Failed to query roles directly:", rolesError);
        
        // Fallback to old method with better error handling
        /*
        try {
          console.log("Step 1: Making RPC call to is_admin");
          
          const { data, error, status, statusText } = await supabase.rpc('is_admin', {
            user_id: session.user.id
          });
          
          console.log("Step 5: Processing response...");
          
          if (error) {
            console.error(" RPC call returned error:", {
              error,
              errorMessage: error.message,
              errorDetails: error.details,
              status,
              statusText,
            });
            
            throw new Error(`Admin check failed: ${error.message} (Code: ${error.code})`);
          }

          if (isMounted) {
            setIsAdmin(!!data);
            setLoading(false);
          }
          
          console.log("Admin status result for", session.user.email, ":", !!data);
        } catch (rpcError) {
          console.error("RPC call failed completely:", rpcError);
          throw rpcError;
        }
        */
      } catch (err: any) {
        console.error("Failed to check user role:", err);
        console.error("=== Finished admin check ===");
        
        if (isMounted) {
          // Remove fallback: do not check if the user's email contains 'admin'
          setIsAdmin(false); 
          setError(err.message || "Failed to verify admin privileges");
          setLoading(false);
        }
      }
    };

    if (session) {
      checkUserRole();
    } else {
      setIsAdmin(false);
      setLoading(false);
      setError(null);
    }

    return () => {
      isMounted = false;
    };
  }, [session]);

  return { isAdmin, loading, error };
}
