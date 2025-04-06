
import { useEffect, useState, useRef, useCallback } from 'react';
import { useReadPosts } from './useReadPosts';
import { usePostsLoader } from './usePostsLoader';

export const useStoryFilters = () => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { posts, loading, error, loadPosts, lastLoad } = usePostsLoader();
  const { readPostIds, markPostAsRead } = useReadPosts();
  
  // Use refs to track loading states
  const initialLoadDoneRef = useRef(false);
  const loadingInProgressRef = useRef(false);
  const mountedRef = useRef(true);
  
  // Reset state on mount/unmount
  useEffect(() => {
    console.log("useStoryFilters mounted");
    mountedRef.current = true;
    initialLoadDoneRef.current = false;
    loadingInProgressRef.current = false;
    
    // Initial load on mount
    const doInitialLoad = async () => {
      if (loadingInProgressRef.current) return;
      
      console.log("Performing initial load on mount");
      loadingInProgressRef.current = true;
      
      try {
        await loadPosts(false, selectedTags);
        if (mountedRef.current) {
          console.log("Initial load completed successfully");
          initialLoadDoneRef.current = true;
        }
      } catch (err) {
        console.error("Error during initial mount load:", err);
      } finally {
        if (mountedRef.current) {
          loadingInProgressRef.current = false;
        }
      }
    };
    
    doInitialLoad();
    
    return () => {
      console.log("useStoryFilters unmounted - cleaning up state refs");
      mountedRef.current = false;
      initialLoadDoneRef.current = false;
      loadingInProgressRef.current = false;
    };
  }, [loadPosts, selectedTags]);
  
  const handleTagSelect = useCallback((tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  }, []);
  
  const clearTags = useCallback(() => {
    setSelectedTags([]);
  }, []);

  const refreshPosts = useCallback((forceRefresh: boolean = true) => {
    if (mountedRef.current) {
      loadPosts(forceRefresh, selectedTags);
    }
  }, [loadPosts, selectedTags]);
  
  return {
    posts,
    loading,
    error,
    loadPosts: refreshPosts,
    readPostIds,
    markPostAsRead,
    selectedTags,
    handleTagSelect,
    clearTags
  };
};
