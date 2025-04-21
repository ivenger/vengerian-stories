
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
        // Query the user_roles table directly
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id);

        if (rolesError) {
          console.error("Error querying user roles:", rolesError);
          throw new Error(`Failed to check admin status: ${rolesError.message}`);
        }

        // Check if the user has the admin role
        const adminRole = roles?.find(role => role.role === 'admin');
        
        if (isMounted) {
          setIsAdmin(!!adminRole);
          setLoading(false);
        }
        
        console.log("Admin check result for", session.user.email, ":", !!adminRole);
      } catch (err: any) {
        console.error("Failed to check user role:", err);
        
        if (isMounted) {
          // Fall back to checking if the user's email contains admin as a last resort
          const isEmailAdmin = session.user.email?.includes('admin') || false;
          setIsAdmin(isEmailAdmin); 
          setError(err.message || "Failed to verify admin privileges");
          setLoading(false);
          
          console.log("Admin check fallback to email for", session.user.email, "result:", isEmailAdmin);
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
