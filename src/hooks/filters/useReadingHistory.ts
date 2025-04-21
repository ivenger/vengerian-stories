
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
  const lastUpdateTime = useRef<number>(0);

  // Track mounting status
  useEffect(() => {
    console.log(`[${new Date().toISOString()}] useReadingHistory: Component mounted`);
    isMounted.current = true;
    
    return () => {
      console.log(`[${new Date().toISOString()}] useReadingHistory: Component unmounted`);
      isMounted.current = false;
    };
  }, []);

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
          // Refresh reading history when changes occur
          fetchReadPosts();
        }
      )
      .subscribe();
    
    return () => {
      console.log(`[${new Date().toISOString()}] useReadingHistory: Removing realtime subscription`);
      supabase.removeChannel(channel);
    };
  }, [user?.id]); // Only re-subscribe when user ID changes

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
  }, [user]); 

  // Extracted fetch function for reuse
  const fetchReadPosts = async () => {
    if (!user || !isMounted.current) {
      return;
    }
    
    // Don't fetch too frequently (debounce) - wait at least 500ms between fetches
    const now = Date.now();
    if (now - lastUpdateTime.current < 500) {
      console.log(`[${new Date().toISOString()}] useReadingHistory: Skipping fetch, too soon since last update`);
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
      
      console.log(`[${new Date().toISOString()}] useReadingHistory: Reading history fetched:`, data?.length || 0, "items");
      if (isMounted.current) {
        setReadPostIds((data || []).map(item => item.post_id));
        hasLoaded.current = true;
      }
    } catch (err) {
      console.error(`[${new Date().toISOString()}] useReadingHistory: Error fetching reading history:`, err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  return {
    readPostIds,
    loading,
    hasLoaded: hasLoaded.current,
    refreshReadingHistory: fetchReadPosts // Expose refresh function
  };
};
