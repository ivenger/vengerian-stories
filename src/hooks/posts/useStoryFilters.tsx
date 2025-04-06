
import { useEffect, useState, useRef, useCallback } from 'react';
import { useReadPosts } from './useReadPosts';
import { usePostsLoader } from './usePostsLoader';

export const useStoryFilters = () => {
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
        await loadPosts(false);
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
  }, [loadPosts]);
  
  return {
    posts,
    loading,
    error,
    loadPosts,
    readPostIds,
    markPostAsRead
  };
};
