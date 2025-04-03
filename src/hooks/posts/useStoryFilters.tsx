
import { useEffect, useState, useRef, useCallback } from 'react';
import { useReadPosts } from './useReadPosts';
import { usePostsLoader } from './usePostsLoader';

export const useStoryFilters = () => {
  const { posts, loading, error, loadPosts, lastLoad } = usePostsLoader();
  const { readPostIds, clearReadPosts } = useReadPosts();
  
  // Use refs to track loading states
  const initialLoadDoneRef = useRef(false);
  const loadingInProgressRef = useRef(false);
  const visibilityChangeSetupDoneRef = useRef(false);
  const mountedRef = useRef(true);
  const visibilityListenerRef = useRef<null | (() => void)>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Clear all timers and listeners
  const cleanupAll = useCallback(() => {
    if (refreshTimerRef.current) {
      console.log("Cleaning up refresh timer");
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    
    if (visibilityListenerRef.current) {
      console.log("Removing visibility change listener");
      document.removeEventListener('visibilitychange', visibilityListenerRef.current);
      visibilityListenerRef.current = null;
    }
    
    visibilityChangeSetupDoneRef.current = false;
    initialLoadDoneRef.current = false;
    loadingInProgressRef.current = false;
  }, []);
  
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
      clearReadPosts(); // Clear read posts state on unmount
      cleanupAll();
    };
  }, [loadPosts, cleanupAll, clearReadPosts]);
  
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
        
        loadPosts(true).catch(err => {
          console.error("Error refreshing posts on visibility change:", err);
        }).finally(() => {
          if (mountedRef.current) {
            loadingInProgressRef.current = false;
          }
        });
      }
    };
    
    // Store the handler reference so we can clean it up properly
    visibilityListenerRef.current = handleVisibilityChange;
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (visibilityListenerRef.current) {
        console.log("Removing visibility change listener");
        document.removeEventListener('visibilitychange', visibilityListenerRef.current);
        visibilityListenerRef.current = null;
      }
      visibilityChangeSetupDoneRef.current = false;
    };
  }, [loadPosts]);
  
  return {
    posts,
    loading,
    error,
    loadPosts,
    readPostIds
  };
};
