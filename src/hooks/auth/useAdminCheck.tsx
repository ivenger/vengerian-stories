import { useState, useEffect, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getAdminCache, setAdminCache } from "./useAdminCache";
import { debounce } from "lodash";

const logAdminCheck = debounce((message: string) => {
  console.log(message);
}, 1000);

export function useAdminCheck(session: Session | null) {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const lastCheckedRef = useRef<string | null>(null);
  const checkInProgressRef = useRef<boolean>(false);
  const skipLogRef = useRef<boolean>(false);
  const checkCountRef = useRef<number>(0);
  const renderCountRef = useRef(0);

  useEffect(() => {
    let isMounted = true;
    renderCountRef.current += 1;

    const checkAdmin = async () => {
      // Log session state
      console.log(`[AdminCheck] Session state:`, {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        accessToken: !!session?.access_token,
        renderCount: renderCountRef.current
      });

      if (!session?.user?.id) {
        console.log('[AdminCheck] No active session or user ID');
        if (isMounted) {
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }

      // Prevent concurrent checks
      if (checkInProgressRef.current) {
        console.log('[AdminCheck] Check already in progress, skipping');
        return;
      }

      // Check cache first
      const cachedStatus = getAdminCache();
      console.log('[AdminCheck] Cache status:', {
        hasCachedStatus: !!cachedStatus,
        cachedUserId: cachedStatus?.userId,
        cachedIsAdmin: cachedStatus?.isAdmin,
        cachedTimestamp: cachedStatus ? new Date(cachedStatus.timestamp).toISOString() : null,
        currentUserId: session.user.id
      });

      if (cachedStatus && cachedStatus.userId === session.user.id) {
        console.log(`[AdminCheck] Using cached admin status: ${cachedStatus.isAdmin}`);
        if (isMounted) {
          setIsAdmin(cachedStatus.isAdmin);
          setLoading(false);
        }
        return;
      }

      // Skip if already checked this user
      if (lastCheckedRef.current === session.user.id) {
        if (!skipLogRef.current) {
          logAdminCheck(`[AdminCheck] Skipping check for same user: ${session.user.email}`);
          skipLogRef.current = true;
          setTimeout(() => {
            skipLogRef.current = false;
          }, 5000);
        }
        return;
      }

      checkInProgressRef.current = true;
      lastCheckedRef.current = session.user.id;
      
      console.log(`[AdminCheck] Starting admin check for user:`, {
        email: session.user.email,
        userId: session.user.id,
        checkCount: ++checkCountRef.current,
        timestamp: new Date().toISOString()
      });

      try {
        // Log the query attempt
        console.log('[AdminCheck] Querying user_roles table...');
        
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        // Log the query result
        console.log('[AdminCheck] Query result:', { 
          roles, 
          error: rolesError,
          errorMessage: rolesError?.message,
          errorCode: rolesError?.code 
        });

        if (rolesError) {
          throw rolesError;
        }

        const isAdminUser = roles?.role === 'admin';
        console.log('[AdminCheck] Admin check result:', {
          role: roles?.role,
          isAdmin: isAdminUser,
          timestamp: new Date().toISOString()
        });
        
        if (isMounted) {
          setIsAdmin(isAdminUser);
          setLoading(false);
          setError(null);
          setAdminCache(session.user.id, isAdminUser);
          console.log('[AdminCheck] State updated and cached:', { isAdmin: isAdminUser });
        }
      } catch (err: any) {
        console.error("[AdminCheck] Error details:", {
          message: err.message,
          code: err.code,
          details: err.details,
          hint: err.hint,
          stack: err.stack
        });
        
        if (isMounted) {
          setIsAdmin(false);
          setError(err.message);
          setLoading(false);
        }
      } finally {
        checkInProgressRef.current = false;
        console.log('[AdminCheck] Check completed');
      }
    };

    checkAdmin();

    return () => {
      isMounted = false;
    };
  }, [session?.user?.id]);

  return { isAdmin, loading, error };
}
