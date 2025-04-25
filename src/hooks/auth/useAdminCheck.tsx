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

  useEffect(() => {
    let isMounted = true;

    const checkAdmin = async () => {
      if (!session?.user?.id) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Prevent concurrent checks
      if (checkInProgressRef.current) {
        return;
      }

      // Check cache first
      const cachedStatus = getAdminCache();
      if (cachedStatus && cachedStatus.userId === session.user.id) {
        setIsAdmin(cachedStatus.isAdmin);
        setLoading(false);
        return;
      }

      // Skip if already checked this user
      if (lastCheckedRef.current === session.user.id) {
        logAdminCheck(`[AdminCheck] Skipping check for same user: ${session.user.email}`);
        return;
      }

      checkInProgressRef.current = true;
      lastCheckedRef.current = session.user.id;

      try {
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        if (rolesError) {
          throw rolesError;
        }

        const isAdminUser = roles?.role === 'admin';
        
        if (isMounted) {
          setIsAdmin(isAdminUser);
          setLoading(false);
          setError(null);
          setAdminCache(session.user.id, isAdminUser);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("[AdminCheck] Error:", err.message);
          setIsAdmin(false);
          setError(err.message);
          setLoading(false);
        }
      } finally {
        checkInProgressRef.current = false;
      }
    };

    checkAdmin();

    return () => {
      isMounted = false;
    };
  }, [session?.user?.id]);

  return { isAdmin, loading, error };
}