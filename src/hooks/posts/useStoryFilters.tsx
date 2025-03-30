
import { useEffect, useState, useRef } from 'react';
import { useReadPosts } from './useReadPosts';
import { usePostsLoader } from './usePostsLoader';

export const useStoryFilters = () => {
  const { posts, loading, error, loadPosts, lastLoad } = usePostsLoader();
  const { readPostIds } = useReadPosts();
  const [navigationCount, setNavigationCount] = useState(0);
  
  // Use refs to track loading states and prevent recursive calls
  const initialLoadDoneRef = useRef(false);
  const loadingInProgressRef = useRef(false);
  const visibilityListenerSetRef = useRef(false);
  
  // Reset counter when page becomes visible after navigation
  useEffect(() => {
    // Only set up visibility change listener once
    if (visibilityListenerSetRef.current) return;
    
    console.log("Setting up visibility change listener");
    visibilityListenerSetRef.current = true;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("Page became visible - checking if refresh needed");
        
        // Only increment navigation counter if we've already done initial load
        // and we're not already loading
        if (initialLoadDoneRef.current && !loadingInProgressRef.current) {
          console.log("Triggering posts refresh after tab visibility change");
          setNavigationCount(prev => prev + 1);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      visibilityListenerSetRef.current = false;
    };
  }, []);
  
  // Secondary effect that responds to navigation counter changes
  useEffect(() => {
    if (navigationCount > 0 && !loadingInProgressRef.current) {
      console.log(`Navigation counter changed (${navigationCount}), reloading posts`);
      loadingInProgressRef.current = true;
      
      loadPosts(true).finally(() => {
        loadingInProgressRef.current = false;
      });
    }
  }, [navigationCount, loadPosts]);
  
  // Initial fetch - only runs once
  useEffect(() => {
    if (initialLoadDoneRef.current || loadingInProgressRef.current) {
      console.log("Initial load already done or in progress, skipping");
      return;
    }
    
    console.log("Initial post loading effect triggered");
    loadingInProgressRef.current = true;
    
    loadPosts().finally(() => {
      initialLoadDoneRef.current = true;
      loadingInProgressRef.current = false;
      console.log("Initial load completed and marked as done");
    });
    
    // Set up a refresh timer to avoid stale data
    const refreshTimer = setInterval(() => {
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      
      if (now - lastLoad > fiveMinutes) {
        console.log("It's been a while since posts were loaded, refreshing");
        
        if (!loadingInProgressRef.current) {
          loadingInProgressRef.current = true;
          loadPosts(true).finally(() => {
            loadingInProgressRef.current = false;
          });
        }
      } else {
        console.log("Recent data found, not refreshing immediately");
      }
    }, 60 * 1000);  // Check every minute
    
    return () => {
      console.log("Cleaning up refresh timer in useStoryFilters");
      clearInterval(refreshTimer);
    };
  }, [loadPosts, lastLoad]);

  return {
    posts,
    loading,
    error,
    loadPosts, // Expose reload function
    readPostIds
  };
};
