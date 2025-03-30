
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
    
    return () => {
      console.log("useStoryFilters unmounted - cleaning up state refs");
      mountedRef.current = false;
      visibilityChangeSetupDoneRef.current = false;
      initialLoadDoneRef.current = false;
      loadingInProgressRef.current = false;
    };
  }, []);
  
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
  
  // Initial load effect - only runs once
  useEffect(() => {
    if (!mountedRef.current) return;
    
    if (initialLoadDoneRef.current || loadingInProgressRef.current) {
      console.log("Initial load already done or in progress, skipping duplicate load");
      return;
    }
    
    console.log("Initial post loading effect triggered (first time)");
    loadingInProgressRef.current = true;
    
    loadPosts()
      .then((success) => {
        if (mountedRef.current) {
          console.log("Initial load completed successfully:", success);
          initialLoadDoneRef.current = true;
        }
      })
      .catch((err) => {
        if (mountedRef.current) {
          console.error("Error during initial load:", err);
        }
      })
      .finally(() => {
        if (mountedRef.current) {
          loadingInProgressRef.current = false;
        }
      });
    
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
  }, [loadPosts, lastLoad]);

  return {
    posts,
    loading,
    error,
    loadPosts,
    readPostIds
  };
};
