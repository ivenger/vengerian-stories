
import { useEffect, useRef, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { useReadingHistory } from './filters/useReadingHistory';
import { useTagsManagement } from './filters/useTagsManagement';
import { useConnectionStatus } from './filters/useConnectionStatus';
import { usePostsLoading } from './filters/usePostsLoading';
import { useFilterState } from './filters/useFilterState';
import { useToast } from './use-toast';

export const useStoryFilters = (user: User | null) => {
  const isMountedRef = useRef(true);
  const refreshTimerRef = useRef<NodeJS.Timeout>();
  const pageKey = useRef(Math.random().toString(36).substring(7));
  const { toast } = useToast();

  const { readPostIds } = useReadingHistory(user);
  const { allTags, selectedTags, toggleTag, clearTags } = useTagsManagement();
  const { connectionStatus, checkConnection, handleConnectionError } = useConnectionStatus();
  const { loading, error, lastLoad, loadPosts } = usePostsLoading(user);
  const { posts, originalPosts, showUnreadOnly, toggleUnreadFilter, updateFilteredPosts } = useFilterState(user);

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
  const handleInitialLoad = async () => {
    const fetchedPosts = await loadPosts(selectedTags);
    if (isMountedRef.current) {
      updateFilteredPosts(fetchedPosts, selectedTags, readPostIds);
    }
  };

  // When filters change, apply them to the original posts
  useEffect(() => {
    if (!isMountedRef.current || loading) return;
    updateFilteredPosts(originalPosts, selectedTags, readPostIds);
  }, [selectedTags, showUnreadOnly, readPostIds]);

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
  }, [lastLoad]);

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
  }, [lastLoad, error]);

  // Show connection status to user
  useEffect(() => {
    if (!loading) {
      handleConnectionError();
    }
  }, [connectionStatus, loading]);

  const clearFilters = () => {
    clearTags();
    toggleUnreadFilter();
    if (originalPosts.length > 0) {
      updateFilteredPosts(originalPosts, [], readPostIds);
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
    loadPosts: handleInitialLoad,
    connectionStatus
  };
};
