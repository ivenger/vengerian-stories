import { useState, useEffect, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getAdminCache, setAdminCache, clearAdminCache } from "./useAdminCache";
import { debounce } from "../../lib/utils";

// Keep detailed logs for admin checks, but debounce to avoid spam
const logAdminCheck = debounce((message: string, data?: any) => {
  if (data) {
    console.log(`[AdminCheck] ${message}`, data);
  } else {
    console.log(`[AdminCheck] ${message}`);
  }
}, 1000);

export function useAdminCheck(session: Session | null) {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const checkInProgressRef = useRef<boolean>(false);
  const lastCheckTimeRef = useRef<number>(0);
  const FORCE_CHECK_INTERVAL = 5 * 60 * 1000; // Force fresh check every 5 minutes

  useEffect(() => {
    let isMounted = true;

    const checkAdmin = async () => {
      const now = Date.now();
      const sessionData = {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        accessToken: !!session?.access_token,
        timestamp: new Date().toISOString()
      };
      
      logAdminCheck('Starting admin check with session:', sessionData);

      if (!session?.user?.id) {
        logAdminCheck('No active session, setting isAdmin to false');
        if (isMounted) {
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }

      // Prevent concurrent checks
      if (checkInProgressRef.current) {
        logAdminCheck('Check already in progress, skipping');
        return;
      }

      const cachedStatus = getAdminCache();
      const timeSinceLastCheck = now - lastCheckTimeRef.current;
      const needsFreshCheck = !cachedStatus || 
                            timeSinceLastCheck > FORCE_CHECK_INTERVAL ||
                            cachedStatus.userId !== session.user.id;

      logAdminCheck('Cache status:', {
        hasCachedStatus: !!cachedStatus,
        needsFreshCheck,
        timeSinceLastCheck,
        cachedUserId: cachedStatus?.userId,
        currentUserId: session.user.id
      });

      if (!needsFreshCheck && cachedStatus) {
        logAdminCheck(`Using cached admin status: ${cachedStatus.isAdmin}`);
        if (isMounted) {
          setIsAdmin(cachedStatus.isAdmin);
          setLoading(false);
        }
        return;
      }

      checkInProgressRef.current = true;
      
      try {
        logAdminCheck('Performing fresh admin check for user:', {
          userId: session.user.id,
          email: session.user.email
        });

        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', session.user.id);

        logAdminCheck('Database query result:', {
          roles,
          error: rolesError?.message,
          code: rolesError?.code
        });

        if (rolesError) {
          throw rolesError;
        }

        // Check if any role in the array is 'admin'
        const isAdminUser = Array.isArray(roles) && roles.length > 0 && roles[0].role === 'admin';
        
        logAdminCheck('Role check result:', {
          hasRole: !!roles?.length,
          roles: roles,
          isAdmin: isAdminUser
        });

        if (isMounted) {
          setIsAdmin(isAdminUser);
          setError(null);
          setAdminCache(session.user.id, isAdminUser);
          lastCheckTimeRef.current = now;
        }
      } catch (err: any) {
        logAdminCheck('Error checking admin status:', {
          message: err.message,
          code: err.code,
          details: err.details
        });
        
        if (isMounted) {
          setIsAdmin(false);
          setError(err.message);
          clearAdminCache(); // Clear cache on error
        }
      } finally {
        checkInProgressRef.current = false;
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAdmin();

    return () => {
      isMounted = false;
    };
  }, [session?.user?.id]);

  return { isAdmin, loading, error };
}
