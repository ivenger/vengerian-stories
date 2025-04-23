import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { BlogEntry } from '../types/blogTypes';
import { fetchPostsWithFallback, checkSupabaseConnection } from '../services/blogService';
import { useToast } from "./use-toast";
import { supabase } from "@/integrations/supabase/client";
import { applyFiltersToData, getBackoffDelay } from './filters/filterUtils';
import { useReadingHistory } from './filters/useReadingHistory';
import { useSessionRefresh } from './filters/useSessionRefresh';
import { useTagsManagement } from './filters/useTagsManagement';

// Max number of retries
const MAX_RETRIES = 3;

export const useStoryFilters = (user: User | null) => {
  const [posts, setPosts] = useState<BlogEntry[]>([]);
  const [originalPosts, setOriginalPosts] = useState<BlogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const { toast } = useToast();
  const [lastLoad, setLastLoad] = useState<number>(Date.now());
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  
  // Custom hooks
  const { readPostIds } = useReadingHistory(user);
  const { refreshSession } = useSessionRefresh();
  const { allTags, selectedTags, toggleTag, clearTags } = useTagsManagement();
  
  // Use refs to track state changes and prevent unnecessary renders
  const isMountedRef = useRef(true);
  const loadedRef = useRef(false);
  const fetchInProgressRef = useRef(false);
  const pageKey = useRef(Math.random().toString(36).substring(7));
  const refreshTimerRef = useRef<NodeJS.Timeout>();
  const filtersRef = useRef({ tags: selectedTags, unreadOnly: showUnreadOnly });

  // Load saved unread filter from localStorage on initial render
  useEffect(() => {
    const savedUnreadFilter = localStorage.getItem('showUnreadOnly');
    
    if (savedUnreadFilter && user) {
      try {
        setShowUnreadOnly(JSON.parse(savedUnreadFilter));
      } catch (e) {
        console.error("Error parsing saved unread filter:", e);
        localStorage.removeItem('showUnreadOnly');
      }
    }
  }, [user]);

  // Save unread filter to localStorage whenever it changes
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('showUnreadOnly', JSON.stringify(showUnreadOnly));
      }
    } catch (e) {
      console.error("Error saving unread filter to localStorage:", e);
    }
    
    // Update filters ref to track changes
    filtersRef.current = { tags: selectedTags, unreadOnly: showUnreadOnly };
  }, [showUnreadOnly, user, selectedTags]);

  // Check Supabase connection
  const checkConnection = useCallback(async () => {
    setConnectionStatus('checking');
    const status = await checkSupabaseConnection();
    setConnectionStatus(status.connected ? 'ok' : 'error');
    return status.connected;
  }, []);

  // Component lifecycle management
  useEffect(() => {
    console.log("StoryFilters: Component mounted with key", pageKey.current);
    isMountedRef.current = true;
    loadedRef.current = false;
    fetchInProgressRef.current = false;
    
    // Set initial loading state
    setLoading(true);
    setIsRetrying(false);
    setRetryCount(0);
    
    // Check connection status first
    checkConnection().then(isConnected => {
      if (isConnected) {
        // Execute initial fetch if connected
        loadPosts();
      } else {
        // Set error state if not connected
        setLoading(false);
        setError("Connection to database unavailable. Please try again later.");
      }
    });
    
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

  // Fetch posts based on selected filters - Updated for better error handling
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
        try {
          await refreshSession();
        } catch (e) {
          console.warn("Failed to refresh session, proceeding anyway:", e);
        }
      }
      
      // Try using the improved fallback method
      console.log("Fetching all posts with enhanced fallback mechanism");
      const allPosts = await fetchPostsWithFallback(selectedTags.length > 0 ? selectedTags : undefined);
      console.log(`Received ${allPosts.length} total posts from API`);
      
      // Bail out if component unmounted during fetch
      if (!isMountedRef.current) {
        console.log("Component unmounted during fetch, skipping state updates");
        fetchInProgressRef.current = false;
        return;
      }
      
      // Cache the original posts
      setOriginalPosts(allPosts);
      
      // Apply filters immediately
      applyFilters(allPosts);
      
      // Reset states
      setRetryCount(0);
      setIsRetrying(false);
      setLoading(false);
      setConnectionStatus('ok');
      setError(null);
      
    } catch (error: any) {
      console.error("Failed to load posts:", error);
      
      if (!isMountedRef.current) {
        console.log("Component unmounted during error handling, skipping state updates");
        return;
      }
      
      // Always show some posts even if there was an error
      if (originalPosts.length > 0) {
        // If we have previous posts, keep showing them
        console.log("Using cached posts due to error");
        applyFilters(originalPosts);
        setError("Couldn't refresh stories. Using cached data.");
      } else {
        // No previous posts, show clear error
        setError("Unable to load stories. Please check your connection and try again.");
        setPosts([]);
      }
      
      setRetryCount((prev) => prev + 1);
      setIsRetrying(false);
      setLoading(false);
      setConnectionStatus('error');
      
    } finally {
      fetchInProgressRef.current = false;
    }
  }, [user, refreshSession, retryCount, isRetrying, applyFilters, selectedTags, showUnreadOnly, originalPosts, checkConnection]);

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

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log(`[${new Date().toISOString()}] App became visible. Checking user session state:`, user);
        
        // Also check connection status when page becomes visible
        const isConnected = await checkConnection();
        
        if (isConnected && (Date.now() - lastLoad > 60000 || error)) {
          // Refresh data if it's been more than a minute or there was an error
          loadPosts(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, loadPosts, lastLoad, error, checkConnection]);

  const toggleUnreadFilter = () => {
    setShowUnreadOnly(!showUnreadOnly);
  };

  const clearFilters = () => {
    console.log("Clearing all filters");
    clearTags();
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
    loadPosts,  // Expose reload function
    connectionStatus
  };
};
