
import { useState, useEffect, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAdminCheck(session: Session | null) {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const checkAttemptedRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    // Abort any existing requests when effect reruns or unmounts
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create a new abort controller for this effect run
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
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

      try {
        // For debugging purposes, log the user we're checking
        console.log(`[AdminCheck] Checking admin status for user: ${session.user.email} (${session.user.id})`);
        
        // Try a direct query first - this is the most reliable approach
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id);

        // If query successful and admin role found, set isAdmin to true
        if (!rolesError && roles) {
          const adminRole = roles.find(role => role.role === 'admin');
          
          if (isMounted && !abortController.signal.aborted) {
            setIsAdmin(!!adminRole);
            setLoading(false);
            checkAttemptedRef.current = true;
            
            if (adminRole) {
              console.log(`[AdminCheck] User ${session.user.email} confirmed as admin via direct query`);
            } else {
              console.log(`[AdminCheck] User ${session.user.email} is not an admin via direct query`);
            }
          }
          return;
        }
        
        // If direct query failed, try the database function as fallback
        if (rolesError) {
          console.log(`[AdminCheck] Direct query failed with error: ${rolesError.message}. Trying function.`);
        }
        
        const { data: isAdminData, error: isAdminError } = await supabase
          .rpc('is_admin', { user_id: session.user.id });
        
        if (!isAdminError && isAdminData !== null && isMounted && !abortController.signal.aborted) {
          setIsAdmin(!!isAdminData);
          setLoading(false);
          checkAttemptedRef.current = true;
          
          if (isAdminData) {
            console.log(`[AdminCheck] User ${session.user.email} confirmed as admin via function`);
          } else {
            console.log(`[AdminCheck] User ${session.user.email} is not an admin via function`);
          }
          return;
        }

        // Both approaches failed, log error and set default values
        if (isMounted && !abortController.signal.aborted) {
          console.error("Failed to check admin status:", rolesError, isAdminError);
          setIsAdmin(false);
          setError("Could not verify admin privileges");
          setLoading(false);
          checkAttemptedRef.current = true;
        }
      } catch (err: any) {
        if (isMounted && !abortController.signal.aborted) {
          console.error("Exception checking user role:", err);
          setIsAdmin(false);
          setError(err.message || "Failed to verify admin privileges");
          setLoading(false);
          checkAttemptedRef.current = true;
        }
      }
    };

    if (session) {
      // Reset flag when session changes
      if (session.user?.id) {
        checkAttemptedRef.current = false;
      }
      
      // Only check if we haven't already checked for this session
      if (!checkAttemptedRef.current) {
        checkUserRole();
      } else {
        console.log("[AdminCheck] Admin check already performed for this session");
        setLoading(false);
      }
    } else {
      setIsAdmin(false);
      setLoading(false);
      setError(null);
    }

    return () => {
      isMounted = false;
      abortController.abort();
      abortControllerRef.current = null;
    };
  }, [session]);

  return { isAdmin, loading, error };
}
