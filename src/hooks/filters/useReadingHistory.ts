
import { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";
import { useSessionRefresh } from './useSessionRefresh';

/**
 * Hook to fetch and manage reading history for a user
 */
export const useReadingHistory = (user: User | null) => {
  const [readPostIds, setReadPostIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);
  const hasLoaded = useRef(false);
  const { shouldRefreshSession, refreshSession } = useSessionRefresh();

  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setReadPostIds([]);
      hasLoaded.current = false;
      return;
    }
    
    setLoading(true);
    
    const fetchReadPosts = async () => {
      try {
        console.log(`[${new Date().toISOString()}] Fetching reading history for user:`, user.id);
        
        // Check if session needs refresh before making the request
        if (shouldRefreshSession()) {
          console.log(`[${new Date().toISOString()}] Refreshing session before fetching reading history`);
          await refreshSession();
        }
        
        const { data, error } = await supabase
          .from('reading_history')
          .select('id, user_id, post_id, read_at')
          .eq('user_id', user.id);
          
        if (error) {
          if (error.code === '406') {
            console.warn(`[${new Date().toISOString()}] useReadingHistory: 406 Not Acceptable error - continuing without reading history`);
            if (isMounted.current) {
              setReadPostIds([]);
            }
          } else {
            console.error(`[${new Date().toISOString()}] useReadingHistory: Error fetching reading history:`, error);
          }
          return;
        }
        
        console.log(`[${new Date().toISOString()}] Reading history fetched:`, data?.length || 0, "items");
        if (isMounted.current) {
          setReadPostIds((data || []).map(item => item.post_id));
          hasLoaded.current = true;
        }
      } catch (err) {
        console.error(`[${new Date().toISOString()}] Error fetching reading history:`, err);
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };
    
    fetchReadPosts();
    
    // Also refresh data when the page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && isMounted.current) {
        console.log(`[${new Date().toISOString()}] Page visible, refreshing reading history`);
        fetchReadPosts();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, shouldRefreshSession, refreshSession]);

  return {
    readPostIds,
    loading,
    hasLoaded: hasLoaded.current
  };
};
