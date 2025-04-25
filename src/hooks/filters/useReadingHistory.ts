import { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";
import { useSessionRefresh } from './useSessionRefresh';
import { ReadingHistoryItem } from '@/types/readingHistory';

const CACHE_DURATION = 60 * 1000; // 1 minute cache
const DEBOUNCE_DELAY = 500; // 500ms debounce

export const useReadingHistory = (user: User | null) => {
  const [readPostIds, setReadPostIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);
  const hasLoaded = useRef(false);
  const { refreshSession, getActiveSession } = useSessionRefresh();
  const lastUpdateTime = useRef<number>(0);
  const realtimeChannel = useRef<any>(null);
  const fetchInProgressRef = useRef(false);
  const debouncedFetchTimeout = useRef<NodeJS.Timeout>();

  // Track mounting status
  useEffect(() => {
    console.log(`[${new Date().toISOString()}] useReadingHistory: Component mounted`);
    isMounted.current = true;
    
    return () => {
      console.log(`[${new Date().toISOString()}] useReadingHistory: Component unmounted`);
      isMounted.current = false;
      
      // Clean up realtime subscription and debounce timeout
      if (realtimeChannel.current) {
        supabase.removeChannel(realtimeChannel.current);
        realtimeChannel.current = null;
      }
      if (debouncedFetchTimeout.current) {
        clearTimeout(debouncedFetchTimeout.current);
      }
    };
  }, []);

  // Set up real-time subscription for reading_history changes
  useEffect(() => {
    if (!user) return;
    
    console.log(`[${new Date().toISOString()}] useReadingHistory: Setting up realtime subscription for user ${user.id}`);
    
    // Subscribe to changes in reading_history for this user
    const channel = supabase
      .channel(`reading_history_changes_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reading_history',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log(`[${new Date().toISOString()}] useReadingHistory: Realtime update received:`, payload);
          // Debounce the fetch to prevent multiple rapid updates
          if (debouncedFetchTimeout.current) {
            clearTimeout(debouncedFetchTimeout.current);
          }
          debouncedFetchTimeout.current = setTimeout(() => {
            if (isMounted.current) {
              fetchReadPosts(true);
            }
          }, DEBOUNCE_DELAY);
        }
      )
      .subscribe();
    
    realtimeChannel.current = channel;
    
    return () => {
      console.log(`[${new Date().toISOString()}] useReadingHistory: Removing realtime subscription`);
      if (debouncedFetchTimeout.current) {
        clearTimeout(debouncedFetchTimeout.current);
      }
      supabase.removeChannel(channel);
      realtimeChannel.current = null;
    };
  }, [user?.id]);

  // Effect to fetch reading history when user changes
  useEffect(() => {
    if (!user) {
      console.log(`[${new Date().toISOString()}] useReadingHistory: No user, clearing reading history`);
      setReadPostIds([]);
      hasLoaded.current = false;
      return;
    }

    if (!hasLoaded.current) {
      fetchReadPosts();
    }
    
    // Also refresh data when the page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && isMounted.current) {
        console.log(`[${new Date().toISOString()}] useReadingHistory: Page visible, checking if refresh needed`);
        const timeSinceLastUpdate = Date.now() - lastUpdateTime.current;
        if (timeSinceLastUpdate > CACHE_DURATION) {
          fetchReadPosts();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]); 

  const fetchReadPosts = async (forceRefresh = false) => {
    if (!user || !isMounted.current || fetchInProgressRef.current) {
      return;
    }
    
    const now = Date.now();
    if (!forceRefresh && now - lastUpdateTime.current < CACHE_DURATION) {
      console.log(`[${new Date().toISOString()}] useReadingHistory: Using cached data`);
      return;
    }

    try {
      fetchInProgressRef.current = true;
      setLoading(true);
      console.log(`[${new Date().toISOString()}] useReadingHistory: Fetching reading history for user:`, user.id);
      
      const session = await getActiveSession();
      if (!session) {
        console.log(`[${new Date().toISOString()}] useReadingHistory: No active session, attempting to refresh`);
        await refreshSession();
      }
      
      const { data, error } = await supabase
        .from('reading_history')
        .select('id, user_id, post_id, read_at')
        .eq('user_id', user.id);
        
      if (error) {
        console.error(`[${new Date().toISOString()}] useReadingHistory: Error fetching reading history:`, error);
        return;
      }
      
      if (isMounted.current) {
        const newReadPostIds = (data || []).map(item => item.post_id);
        if (JSON.stringify(newReadPostIds) !== JSON.stringify(readPostIds)) {
          setReadPostIds(newReadPostIds);
        }
        hasLoaded.current = true;
        lastUpdateTime.current = now;
      }
    } catch (err) {
      console.error(`[${new Date().toISOString()}] useReadingHistory: Error fetching reading history:`, err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
      fetchInProgressRef.current = false;
    }
  };

  return {
    readPostIds,
    loading,
    hasLoaded: hasLoaded.current,
    refreshReadingHistory: (force = false) => fetchReadPosts(force)
  };
};
