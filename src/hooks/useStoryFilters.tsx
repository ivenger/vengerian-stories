import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { BlogEntry } from '../types/blogTypes';
import { fetchFilteredPosts, fetchAllTags } from '../services/blogService';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';

// Helper function to apply filters - defined outside the hook to avoid circular dependencies
const applyFiltersToData = (
  postsToFilter: BlogEntry[],
  selectedTags: string[],
  showUnreadOnly: boolean,
  readPostIds: string[],
  user: any | null
) => {
  console.log("Applying filters to posts", {
    totalPosts: postsToFilter.length,
    selectedTags,
    showUnreadOnly,
    readIdsCount: readPostIds.length
  });
  
  let filteredPosts = [...postsToFilter];
  
  if (selectedTags.length > 0) {
    console.log("Filtering by tags:", selectedTags);
    filteredPosts = filteredPosts.filter(post => {
      if (!post.tags) return false;
      return selectedTags.some(tag => post.tags?.includes(tag));
    });
    console.log(`${filteredPosts.length} posts after tag filtering`);
  }
  
  // Apply read/unread filter if enabled
  if (showUnreadOnly && user) {
    console.log("Filtering for unread posts, read IDs count:", readPostIds.length);
    filteredPosts = filteredPosts.filter(post => !readPostIds.includes(post.id));
    console.log(`${filteredPosts.length} posts after unread filter`);
  }
  
  return filteredPosts;
};

export const useStoryFilters = (user: User | null) => {
  const [posts, setPosts] = useState<BlogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [readPostIds, setReadPostIds] = useState<string[]>([]);
  const { toast } = useToast();
  const [lastLoad, setLastLoad] = useState<number>(Date.now());
  const [originalPosts, setOriginalPosts] = useState<BlogEntry[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Use refs to track state changes and prevent unnecessary renders
  const loadedRef = useRef(false);
  const filtersRef = useRef({ tags: selectedTags, unreadOnly: showUnreadOnly });
  const fetchInProgressRef = useRef(false);
  const isMountedRef = useRef(true);
  const pageKey = useRef(Math.random().toString(36).substring(7));
  const refreshTimerRef = useRef<NodeJS.Timeout>();

  // Max number of retries
  const MAX_RETRIES = 3;
  
  // Reset mounted state and cleanup on unmount
  useEffect(() => {
    console.log("StoryFilters: Component mounted with key", pageKey.current);
    isMountedRef.current = true;
    loadedRef.current = false;
    fetchInProgressRef.current = false;
    
    // Set initial loading state
    setLoading(true);
    setIsRetrying(false);
    setRetryCount(0);
    
    // Execute initial fetch
    loadPosts();
    loadedRef.current = true;
    
    return () => {
      console.log("StoryFilters: Component unmounting, cleaning up");
      isMountedRef.current = false;
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      fetchInProgressRef.current = false;
      setIsRetrying(false);
    };
  }, []);
  
  // Load saved filters from localStorage on initial render
  useEffect(() => {
    const savedTags = localStorage.getItem('selectedTags');
    const savedUnreadFilter = localStorage.getItem('showUnreadOnly');
    
    if (savedTags) {
      try {
        setSelectedTags(JSON.parse(savedTags));
      } catch (e) {
        console.error("Error parsing saved tags:", e);
        localStorage.removeItem('selectedTags');
      }
    }
    
    if (savedUnreadFilter && user) {
      try {
        setShowUnreadOnly(JSON.parse(savedUnreadFilter));
      } catch (e) {
        console.error("Error parsing saved unread filter:", e);
        localStorage.removeItem('showUnreadOnly');
      }
    }
  }, [user]);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('selectedTags', JSON.stringify(selectedTags));
      
      if (user) {
        localStorage.setItem('showUnreadOnly', JSON.stringify(showUnreadOnly));
      }
    } catch (e) {
      console.error("Error saving filters to localStorage:", e);
    }
    
    // Update filters ref to track changes
    filtersRef.current = { tags: selectedTags, unreadOnly: showUnreadOnly };
  }, [selectedTags, showUnreadOnly, user]);

  // Fetch reading history if user is logged in
  useEffect(() => {
    if (!user || !isMountedRef.current) return;
    
    const fetchReadPosts = async () => {
      try {
        console.log("Fetching reading history for user:", user.id);
        const { data, error } = await supabase
          .from('reading_history')
          .select('post_id')
          .eq('user_id', user.id as string);
          
        if (error) {
          if (error.code === '406') {
            console.warn("useStoryFilters: 406 Not Acceptable error when fetching reading history - continuing without reading history");
            if (isMountedRef.current) {
              setReadPostIds([]);
            }
          } else {
            console.error("useStoryFilters: Error fetching reading history:", error);
          }
          return;
        }
        
        if (data && Array.isArray(data)) {
          const readPostIds = data.map(item => item.post_id as string);
          console.log("Reading history fetched:", readPostIds.length, "items");
          if (isMountedRef.current) {
            setReadPostIds(readPostIds);
          }
        }
      } catch (err) {
        console.error("Error fetching reading history:", err);
        // Non-critical, don't set error state
      }
    };
    
    fetchReadPosts();
  }, [user]);

  // Fetch all available tags
  useEffect(() => {
    const loadTags = async () => {
      if (!isMountedRef.current) return;
      try {
        console.log("Fetching all tags...");
        const tags = await fetchAllTags();
        console.log("Tags fetched successfully:", tags);
        if (isMountedRef.current) {
          setAllTags(tags);
        }
      } catch (error) {
        console.error("Failed to load tags:", error);
        // Don't set error state for tags failure as it's not critical
      }
    };
    
    loadTags();
  }, []);

  // Implement exponential backoff for retries
  const getBackoffDelay = (retryAttempt: number) => {
    // Start with a 2 second delay and double each time, max 30 seconds
    const baseDelay = 2000;
    const delay = Math.min(baseDelay * Math.pow(2, retryAttempt), 30000);
    // Add a bit of randomness to avoid all clients retrying at the same time
    return delay + (Math.random() * 1000);
  };

  // Use the pre-defined helper function through a callback
  const applyFilters = useCallback((postsToFilter: BlogEntry[]) => {
    const filteredPosts = applyFiltersToData(
      postsToFilter,
      selectedTags,
      showUnreadOnly,
      readPostIds,
      user
    );
    
    if (isMountedRef.current) {
      setPosts(filteredPosts);
    }
  }, [selectedTags, showUnreadOnly, user, readPostIds]);

  // Define refreshSession function
  const refreshSession = async () => {
    console.log(`[${new Date().toISOString()}] Attempting to refresh session`);
    try {
        const { error } = await supabase.auth.refreshSession();
        if (error) {
            console.error(`[${new Date().toISOString()}] Failed to refresh session:`, error);
            return false;
        }
        console.log(`[${new Date().toISOString()}] Session refreshed successfully`);
        return true;
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Error refreshing session:`, err);
        return false;
    }
  };

  // Fetch posts based on selected filters
  const loadPosts = useCallback(async (forceRefresh = false) => {
    // Don't start a new fetch if one is in progress or component is unmounting
    if (!isMountedRef.current) {
      console.log("Component unmounted, skipping fetch");
      return;
    }

    // If retrying, only proceed if this is a forced refresh
    if (isRetrying && !forceRefresh) {
      console.log("Retry in progress, skipping non-forced fetch");
      return;
    }
    
    // Prevent multiple simultaneous fetch attempts unless forced
    if (fetchInProgressRef.current && !forceRefresh) {
      console.log("Fetch already in progress, skipping non-forced fetch");
      return;
    }
    
    console.log("loadPosts called with filters:", { 
      selectedTags, 
      showUnreadOnly, 
      userLoggedIn: !!user,
      forceRefresh,
      retryCount,
      loadedRef: loadedRef.current,
      pageKey: pageKey.current
    });
    
    fetchInProgressRef.current = true;
    setLoading(true);
    setError(null);
    setLastLoad(Date.now());
    
    try {
      // If we've been loading for too long with a session, try refreshing it
      if (user && forceRefresh) {
        await refreshSession();
      }
      
      // Always fetch all posts first
      console.log("Fetching all posts");
      const allPosts = await fetchFilteredPosts();
      console.log(`Received ${allPosts.length} total posts from API`);
      
      // Bail out if component unmounted during fetch
      if (!isMountedRef.current) {
        console.log("Component unmounted during fetch, skipping state updates");
        return;
      }
      
      setOriginalPosts(allPosts);
      applyFilters(allPosts);
      
      // Reset retry count and loading state on success
      setRetryCount(0);
      setIsRetrying(false);
      setLoading(false);
      
    } catch (error: any) {
      console.error("Failed to load posts:", error);
      
      if (!isMountedRef.current) {
        console.log("Component unmounted during error handling, skipping state updates");
        return;
      }
      
      // Handle potential auth errors
      if (error?.message?.includes('JWT') || error?.message?.includes('token') || 
          error?.message?.includes('auth') || error?.message?.includes('authentication')) {
        console.log("Detected potential auth error, attempting session refresh");
        if (user) {
          const refreshed = await refreshSession();
          if (refreshed) {
            console.log("Session refreshed, retrying post load");
            setIsRetrying(true);
            // Always clean up the current fetch before scheduling a retry
            fetchInProgressRef.current = false;
            setTimeout(() => {
              if (isMountedRef.current) {
                loadPosts(true); // Force refresh after auth error
              }
            }, 1000);
            return;
          }
        }
      }
      
      // Check if we should retry
      if (retryCount < MAX_RETRIES && error?.message?.includes('Failed to fetch')) {
        const nextRetryCount = retryCount + 1;
        const backoffDelay = getBackoffDelay(retryCount);
        
        console.log(`Retry ${nextRetryCount}/${MAX_RETRIES} scheduled in ${backoffDelay}ms`);
        setRetryCount(nextRetryCount);
        setError(`Network error. Retrying in ${Math.round(backoffDelay/1000)} seconds...`);
        setIsRetrying(true);
        
        // Clean up the current fetch before scheduling retry
        fetchInProgressRef.current = false;
        
        // Schedule retry with backoff
        setTimeout(() => {
          if (isMountedRef.current) {
            console.log(`Executing retry ${nextRetryCount}/${MAX_RETRIES}`);
            loadPosts(true); // Force refresh on retry
          } else {
            console.log("Component unmounted during retry delay, cancelling");
            setIsRetrying(false);
          }
        }, backoffDelay);
      } else {
        // We've exhausted retries or it's not a network error
        setError(
          error?.message === "TypeError: Failed to fetch" 
            ? "Network error. Please check your connection and try again." 
            : "Failed to load stories. Please try again later."
        );
        setPosts([]);
        setRetryCount(0);
        setIsRetrying(false);
        setLoading(false);
      }
    } finally {
      // If we're not retrying, we can safely reset all state
      if (!isRetrying) {
        fetchInProgressRef.current = false;
        setLoading(false);
      }
    }
  }, [user, refreshSession, retryCount, isRetrying, applyFilters, selectedTags, showUnreadOnly]);

  // When filters change, apply them to the original posts
  useEffect(() => {
    if (!isMountedRef.current) {
      return;
    }

    if (originalPosts.length > 0 && !loading && !isRetrying) {
      // Only apply filters if they've actually changed from what we last applied
      const currentFilters = { tags: selectedTags, unreadOnly: showUnreadOnly };
      if (JSON.stringify(currentFilters) !== JSON.stringify(filtersRef.current)) {
        console.log("Filters changed, applying to cached posts");
        applyFilters(originalPosts);
        filtersRef.current = currentFilters;
      }
    }
  }, [selectedTags, showUnreadOnly, applyFilters, originalPosts, loading, isRetrying]);

  // Reset loadedRef when user changes to force a new fetch
  // Also reset when component mounts
  useEffect(() => {
    loadedRef.current = false;
  }, [user]);

  // Set up refresh timer
  useEffect(() => {
    if (!isMountedRef.current) return;

    refreshTimerRef.current = setInterval(() => {
      const now = Date.now();
      if (now - lastLoad > 10 * 60 * 1000 && isMountedRef.current) {  // 10 minutes
        console.log("It's been a while since posts were loaded, refreshing");
        loadPosts(true);
      }
    }, 60 * 1000);  // Check every minute
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [loadPosts, lastLoad]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
        if (document.visibilityState === 'visible') {
            console.log(`[${new Date().toISOString()}] App became visible. Checking user session state:`, user);
            console.log(`[${new Date().toISOString()}] Checking localStorage for session:`, localStorage.getItem('supabase.auth.token'));
            if (user) {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error || !session) {
                    console.error(`[${new Date().toISOString()}] No active session found. Error:`, error);
                } else {
                    console.log(`[${new Date().toISOString()}] Active session found. Session details:`, session);
                }
            }
        }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
}, [user]);

  const toggleTag = (tag: string) => {
    console.log(`Toggling tag: ${tag}`);
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };
  
  const toggleUnreadFilter = () => {
    setShowUnreadOnly(!showUnreadOnly);
  };

  const clearFilters = () => {
    console.log("Clearing all filters");
    setSelectedTags([]);
    setShowUnreadOnly(false);
    setRetryCount(0);
    
    // Immediately apply empty filters to show all posts
    if (originalPosts.length > 0) {
      console.log("Showing all posts after clearing filters");
      setPosts(originalPosts);
    }
  };

  const hasActiveFilters = selectedTags.length > 0 || showUnreadOnly;

  return {
    posts,
    loading,
    error,
    allTags,
    selectedTags,
    showUnreadOnly,
    toggleTag,
    toggleUnreadFilter,
    clearFilters,
    hasActiveFilters,
    loadPosts  // Expose reload function
  };
};
