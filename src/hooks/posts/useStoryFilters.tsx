
import { useEffect, useState, useRef } from 'react';
import { useReadPosts } from './useReadPosts';
import { usePostsLoader } from './usePostsLoader';

export const useStoryFilters = () => {
  const { posts, loading, error, loadPosts, lastLoad } = usePostsLoader();
  const { readPostIds } = useReadPosts();
  
  // Use refs to track loading states
  const initialLoadDoneRef = useRef(false);
  const loadingInProgressRef = useRef(false);
  const visibilityChangeSetupDoneRef = useRef(false);
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
      visibilityChangeSetupDoneRef.current = false;
      initialLoadDoneRef.current = false;
      loadingInProgressRef.current = false;
    };
  }, [loadPosts]);
  
  // Handle visibility change to refresh posts when needed
  useEffect(() => {
    if (!mountedRef.current) return;
    
    // Skip if we've already set this up
    if (visibilityChangeSetupDoneRef.current) {
      console.log("Visibility change listener already set up, skipping");
      return;
    }
    
    visibilityChangeSetupDoneRef.current = true;
    console.log("Setting up visibility change listener (once)");
    
    const handleVisibilityChange = () => {
      if (!mountedRef.current) return;
      
      if (document.visibilityState === 'visible' && initialLoadDoneRef.current && !loadingInProgressRef.current) {
        console.log("Page became visible - refreshing posts");
        loadingInProgressRef.current = true;
        
        loadPosts(true).finally(() => {
          if (mountedRef.current) {
            loadingInProgressRef.current = false;
          }
        });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      console.log("Removing visibility change listener");
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      visibilityChangeSetupDoneRef.current = false;
    };
  }, [loadPosts]);
  
  // Set up a refresh timer to periodically refresh data
  useEffect(() => {
    if (!mountedRef.current || !initialLoadDoneRef.current) return;
    
    console.log("Setting up periodic refresh timer");
    
    // Set up a simple refresh timer to avoid stale data
    const refreshIntervalId = setInterval(() => {
      if (!mountedRef.current) {
        return;
      }
      
      if (loadingInProgressRef.current) {
        console.log("Load already in progress, skipping scheduled refresh");
        return;
      }
      
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      
      if (now - lastLoad > fiveMinutes && !loadingInProgressRef.current) {
        console.log("Scheduled refresh: It's been over 5 minutes since last load");
        loadingInProgressRef.current = true;
        
        loadPosts(true)
          .finally(() => {
            if (mountedRef.current) {
              loadingInProgressRef.current = false;
            }
          });
      }
    }, 60 * 1000);
    
    return () => {
      console.log("Cleaning up refresh timer");
      clearInterval(refreshIntervalId);
    };
  }, [loadPosts, lastLoad, initialLoadDoneRef.current]);

  return {
    posts,
    loading,
    error,
    loadPosts,
    readPostIds
  };
};
