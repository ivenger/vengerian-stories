
import { useState, useEffect, useRef, useCallback } from 'react';
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
  const lastUpdateTime = useRef<number>(0);

  // Track mounting status
  useEffect(() => {
    console.log(`[${new Date().toISOString()}] useReadingHistory: Component mounted with userId: ${user?.id}`);
    isMounted.current = true;
    
    return () => {
      console.log(`[${new Date().toISOString()}] useReadingHistory: Component unmounted`);
      isMounted.current = false;
    };
  }, [user?.id]);

  // Create a memoized fetch function that we can call from multiple places
  const fetchReadPosts = useCallback(async () => {
    if (!user || !isMounted.current) {
      console.log(`[${new Date().toISOString()}] useReadingHistory: fetchReadPosts called but user is ${user ? 'available' : 'not available'} and component is ${isMounted.current ? 'mounted' : 'unmounted'}`);
      return;
    }
    
    // Don't fetch too frequently (debounce) - wait at least 500ms between fetches
    const now = Date.now();
    if (now - lastUpdateTime.current < 500) {
      console.log(`[${new Date().toISOString()}] useReadingHistory: Skipping fetch, too soon since last update (${now - lastUpdateTime.current}ms)`);
      return;
    }
    lastUpdateTime.current = now;
    
    try {
      setLoading(true);
      console.log(`[${new Date().toISOString()}] useReadingHistory: Fetching reading history for user:`, user.id);
      
      // Check if session needs refresh before making the request
      if (shouldRefreshSession()) {
        console.log(`[${new Date().toISOString()}] useReadingHistory: Refreshing session before fetching reading history`);
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
      
      const postIds = (data || []).map(item => item.post_id);
      console.log(`[${new Date().toISOString()}] useReadingHistory: Reading history fetched: ${postIds.length} items:`, postIds);
      
      if (isMounted.current) {
        setReadPostIds(postIds);
        hasLoaded.current = true;
      }
    } catch (err) {
      console.error(`[${new Date().toISOString()}] useReadingHistory: Error fetching reading history:`, err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [user, refreshSession, shouldRefreshSession]);

  // Set up real-time subscription for reading_history changes
  useEffect(() => {
    if (!user) {
      return;
    }
    
    console.log(`[${new Date().toISOString()}] useReadingHistory: Setting up realtime subscription for user ${user.id}`);
    
    // Subscribe to changes in reading_history for this user
    const channel = supabase
      .channel('reading_history_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'reading_history',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log(`[${new Date().toISOString()}] useReadingHistory: Realtime update received:`, payload);
          // Check if component is still mounted before fetching
          if (isMounted.current) {
            console.log(`[${new Date().toISOString()}] useReadingHistory: Refreshing reading history after realtime update`);
            fetchReadPosts();
          }
        }
      )
      .subscribe((status) => {
        console.log(`[${new Date().toISOString()}] useReadingHistory: Realtime subscription status:`, status);
      });
    
    return () => {
      console.log(`[${new Date().toISOString()}] useReadingHistory: Removing realtime subscription`);
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchReadPosts]); // Added fetchReadPosts to the dependency array

  // Effect to fetch reading history when user changes
  useEffect(() => {
    if (!user) {
      console.log(`[${new Date().toISOString()}] useReadingHistory: No user, clearing reading history`);
      setReadPostIds([]);
      hasLoaded.current = false;
      return;
    }
    
    fetchReadPosts();
    
    // Also refresh data when the page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && isMounted.current) {
        console.log(`[${new Date().toISOString()}] useReadingHistory: Page visible, refreshing reading history`);
        fetchReadPosts();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, fetchReadPosts]); 

  return {
    readPostIds,
    loading,
    hasLoaded: hasLoaded.current,
    refreshReadingHistory: fetchReadPosts // Expose refresh function
  };
};
