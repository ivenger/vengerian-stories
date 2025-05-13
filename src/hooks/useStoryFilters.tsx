import { useEffect, useRef, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { useReadingHistory } from './filters/useReadingHistory';
import { useTagsManagement } from './filters/useTagsManagement';
import { useConnectionStatus } from './filters/useConnectionStatus';
import { usePostsLoading } from './filters/usePostsLoading';
import { useFilterState } from './filters/useFilterState';
import { useToast } from './use-toast';
import { BlogEntry } from '@/types/blogTypes';

export const useStoryFilters = (user: User | null) => {
  const isMountedRef = useRef(true);
  const refreshTimerRef = useRef<NodeJS.Timeout>();
  const pageKey = useRef(Math.random().toString(36).substring(7));
  const { toast } = useToast();

  const { readPostIds } = useReadingHistory(user);
  const { allTags, selectedTags, toggleTag, clearTags } = useTagsManagement();
  const { connectionStatus, checkConnection, handleConnectionError } = useConnectionStatus();
  const { loading, error, lastLoad, loadPosts: originalLoadPosts } = usePostsLoading(user);
  const { 
    posts, 
    originalPosts, 
    showUnreadOnly, 
    selectedLanguages,
    toggleLanguage,
    toggleUnreadFilter, 
    updateFilteredPosts,
    clearAllFilters
  } = useFilterState(user);

  // Component lifecycle management
  useEffect(() => {
    console.log("StoryFilters: Component mounted with key", pageKey.current);
    isMountedRef.current = true;
    
    // Check connection status first
    checkConnection().then(isConnected => {
      if (isConnected) {
        handleInitialLoad();
      }
    });
    
    return () => {
      console.log("StoryFilters: Component unmounting, cleaning up");
      isMountedRef.current = false;
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, []);

  // Handle initial posts load
  const handleInitialLoad = useCallback(async (forceRefresh = false) => {
    try {
      const fetchedPosts = await originalLoadPosts(selectedTags, forceRefresh);
      if (isMountedRef.current && Array.isArray(fetchedPosts)) {
        updateFilteredPosts(fetchedPosts, selectedTags, readPostIds);
      }
    } catch (err) {
      console.error("Error in handleInitialLoad:", err);
      if (isMountedRef.current) {
        toast({
          title: "Error loading stories",
          description: "Please try refreshing the page",
          variant: "destructive"
        });
      }
    }
  }, [originalLoadPosts, selectedTags, readPostIds, updateFilteredPosts, toast]);

  // Create a simplified loadPosts function that matches the expected API in Index.tsx
  const loadPosts = useCallback(() => {
    return handleInitialLoad(true);
  }, [handleInitialLoad]);

  // When filters change, apply them to the original posts
  useEffect(() => {
    if (!isMountedRef.current || loading) return;
    updateFilteredPosts(originalPosts, selectedTags, readPostIds);
  }, [selectedTags, selectedLanguages, showUnreadOnly, readPostIds]);

  // Set up refresh timer
  useEffect(() => {
    if (!isMountedRef.current) return;

    refreshTimerRef.current = setInterval(() => {
      if (Date.now() - lastLoad > 10 * 60 * 1000 && isMountedRef.current) {
        console.log("It's been a while since posts were loaded, refreshing");
        handleInitialLoad();
      }
    }, 60 * 1000);
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [lastLoad, handleInitialLoad]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const isConnected = await checkConnection();
        if (isConnected && (Date.now() - lastLoad > 60000 || error)) {
          handleInitialLoad();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [lastLoad, error, handleInitialLoad, checkConnection]);

  // Show connection status to user
  useEffect(() => {
    if (!loading) {
      handleConnectionError();
    }
  }, [connectionStatus, loading, handleConnectionError]);

  // Extract all unique languages from posts
  const allLanguages = useRef<string[]>([]);
  useEffect(() => {
    if (originalPosts.length > 0) {
      const uniqueLanguages = new Set<string>();
      originalPosts.forEach(post => {
        if (post.language) {
          post.language.forEach(lang => uniqueLanguages.add(lang));
        }
      });
      allLanguages.current = Array.from(uniqueLanguages).sort();
      console.log(`[${new Date().toISOString()}] Extracted languages:`, allLanguages.current);
    }
  }, [originalPosts]);

  const clearFilters = () => {
    clearAllFilters();
    if (originalPosts.length > 0) {
      updateFilteredPosts(originalPosts, [], readPostIds);
    }
  };

  const hasActiveFilters = selectedTags.length > 0 || showUnreadOnly || selectedLanguages.length > 0;

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
    loadPosts,
    connectionStatus,
    allLanguages: allLanguages.current,
    selectedLanguages,
    toggleLanguage
  };
};
