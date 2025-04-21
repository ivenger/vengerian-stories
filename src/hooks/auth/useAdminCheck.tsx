
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
        // First try using the user_roles table directly instead of the RPC function
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id);

        // If we can query the roles table directly
        if (!rolesError && roles) {
          const adminRole = roles.find(role => role.role === 'admin');
          if (isMounted) {
            setIsAdmin(!!adminRole);
            setLoading(false);
          }
          console.log("Admin status result for", session.user.email, ":", !!adminRole);
          return;
        }

        // Fallback to RPC if table query fails
        const { data, error } = await supabase.rpc('is_admin', {
          user_id: session.user.id
        });

        if (error) {
          console.error("RPC call failed:", {
            error,
            userId: session.user.id,
            hasSession: !!session,
            accessToken: session.access_token ? "Present" : "Missing",
            functionCall: "is_admin",
            parameters: { user_id: session.user.id }
          });
          
          throw new Error(`Admin check failed: ${error.message} (Code: ${error.code})`);
        }

        if (isMounted) {
          setIsAdmin(!!data);
          setLoading(false);
        }
        
        console.log("Admin status result for", session.user.email, ":", !!data);
      } catch (err: any) {
        console.error("Failed to check user role:", err);
        
        if (isMounted) {
          setIsAdmin(false); // Default to non-admin on error
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
