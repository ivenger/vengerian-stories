
import { useState, useEffect, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAdminCheck(session: Session | null) {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const checkAttemptedRef = useRef<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    
    const checkUserRole = async () => {
      // Reset state on every check only if component is mounted
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

      // Only check admin role once per session
      if (checkAttemptedRef.current) {
        console.log("[AdminCheck] Already checked admin status for this session, reusing result");
        setLoading(false);
        return;
      }

      try {
        checkAttemptedRef.current = true;
        
        // First try using the database function
        console.log("[AdminCheck] Querying is_admin function for user:", session.user.id, session.user.email);
        const { data: isAdminData, error: isAdminError } = await supabase
          .rpc('is_admin', { user_id: session.user.id });

        if (!isAdminError) {
          console.log("[AdminCheck] is_admin function result:", isAdminData);
          if (isMounted) {
            setIsAdmin(!!isAdminData);
            setLoading(false);
          }
          return;
        }
        
        // Fallback to querying the user_roles table directly if the function call fails
        console.log("[AdminCheck] Function call failed, querying user_roles directly:", isAdminError);
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
        } else {
          // If both approaches failed, log why
          console.error("Failed to check admin status:", isAdminError, rolesError);
          
          if (isMounted) {
            // Default to false and inform about the error
            setIsAdmin(false); 
            setError("Could not verify admin privileges. Please try refreshing the page.");
            setLoading(false);
          }
        }
      } catch (err: any) {
        console.error("Failed to check user role:", err);
        
        if (isMounted) {
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
