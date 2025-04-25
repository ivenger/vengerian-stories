import { useState, useEffect, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getAdminCache, setAdminCache } from "./useAdminCache";

const DEBOUNCE_DELAY = 500; // 500ms debounce

export function useAdminCheck(session: Session | null) {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const checkAttemptedRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastCheckedUserIdRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Abort any existing requests when effect reruns or unmounts
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create a new abort controller for this effect run
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    const checkUserRole = async () => {
      // Reset state on every check only if component is mounted
      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
      }
      
      // No session means not an admin
      if (!session?.user?.id) {
        if (isMountedRef.current) {
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }

      // Check cache first
      const cachedAdmin = getAdminCache();
      if (cachedAdmin && cachedAdmin.userId === session.user.id) {
        if (isMountedRef.current && !abortController.signal.aborted) {
          setIsAdmin(cachedAdmin.isAdmin);
          setLoading(false);
          checkAttemptedRef.current = true;
          console.log(`[AdminCheck] Using cached admin status for user ${session.user.email}`);
          return;
        }
      }

      try {
        // Debounce the actual check
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(async () => {
          if (!isMountedRef.current || abortController.signal.aborted) return;

          // For debugging purposes, log the user we're checking
          console.log(`[AdminCheck] Checking admin status for user: ${session.user.email} (${session.user.id})`);
          
          // Try a direct query first - this is the most reliable approach
          const { data: roles, error: rolesError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id);

          if (!isMountedRef.current || abortController.signal.aborted) return;

          // If query successful and admin role found, set isAdmin to true
          if (!rolesError && roles) {
            const adminRole = roles.find(role => role.role === 'admin');
            const isAdminUser = !!adminRole;
            
            setIsAdmin(isAdminUser);
            setLoading(false);
            checkAttemptedRef.current = true;
            
            // Cache the result
            setAdminCache(session.user.id, isAdminUser);
            
            if (adminRole) {
              console.log(`[AdminCheck] User ${session.user.email} confirmed as admin via direct query`);
            } else {
              console.log(`[AdminCheck] User ${session.user.email} is not an admin via direct query`);
            }
            return;
          }
          
          // If direct query failed, try the database function as fallback
          if (rolesError) {
            console.log(`[AdminCheck] Direct query failed with error: ${rolesError.message}. Trying function.`);
          }
          
          const { data: isAdminData, error: isAdminError } = await supabase
            .rpc('is_admin', { user_id: session.user.id });
          
          if (!isMountedRef.current || abortController.signal.aborted) return;

          if (!isAdminError && isAdminData !== null) {
            const isAdminUser = !!isAdminData;
            setIsAdmin(isAdminUser);
            setLoading(false);
            checkAttemptedRef.current = true;
            
            // Cache the result
            setAdminCache(session.user.id, isAdminUser);
            
            if (isAdminData) {
              console.log(`[AdminCheck] User ${session.user.email} confirmed as admin via function`);
            } else {
              console.log(`[AdminCheck] User ${session.user.email} is not an admin via function`);
            }
            return;
          }

          // Both approaches failed, log error and set default values
          console.error("Failed to check admin status:", rolesError, isAdminError);
          setIsAdmin(false);
          setError("Could not verify admin privileges");
          setLoading(false);
          checkAttemptedRef.current = true;
        }, DEBOUNCE_DELAY);
      } catch (err: any) {
        if (isMountedRef.current && !abortController.signal.aborted) {
          console.error("Exception checking user role:", err);
          setIsAdmin(false);
          setError(err.message || "Failed to verify admin privileges");
          setLoading(false);
          checkAttemptedRef.current = true;
        }
      }
    };

    if (session) {
      // Prevent rechecking for same user
      if (session.user?.id === lastCheckedUserIdRef.current) {
        console.log("[AdminCheck] Skipping check for same user");
        return;
      }
      
      if (session.user?.id) {
        lastCheckedUserIdRef.current = session.user.id;
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
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [session]);
  
  return { isAdmin, loading, error };
}