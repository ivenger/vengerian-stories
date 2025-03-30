
import { useEffect, useState, useRef } from 'react';
import { useReadPosts } from './useReadPosts';
import { usePostsLoader } from './usePostsLoader';

export const useStoryFilters = () => {
  const { posts, loading, error, loadPosts, lastLoad } = usePostsLoader();
  const { readPostIds } = useReadPosts();
  const [navigationCount, setNavigationCount] = useState(0);
  
  // Use a ref to track whether initial load has happened
  const initialLoadDoneRef = useRef(false);
  const loadingInProgressRef = useRef(false);
  
  // Reset counter when page becomes visible after navigation
  useEffect(() => {
    console.log("Navigation effect - checking if page is visible after navigation");
    
    // Only set up visibility change listener if we've already done initial load
    if (initialLoadDoneRef.current) {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          console.log("Page became visible - triggering posts refresh");
          
          // Only increment navigation counter if we're not already loading
          if (!loadingInProgressRef.current) {
            setNavigationCount(prev => prev + 1);
          }
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [initialLoadDoneRef.current]);
  
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
    console.log("Initial post loading effect triggered");
    
    if (!initialLoadDoneRef.current && !loadingInProgressRef.current) {
      loadingInProgressRef.current = true;
      
      loadPosts().finally(() => {
        initialLoadDoneRef.current = true;
        loadingInProgressRef.current = false;
      });
      
      // Set up a refresh timer to avoid stale data
      const refreshTimer = setInterval(() => {
        const now = Date.now();
        if (now - lastLoad > 5 * 60 * 1000) {  // 5 minutes
          console.log("It's been a while since posts were loaded, refreshing");
          if (!loadingInProgressRef.current) {
            loadingInProgressRef.current = true;
            loadPosts(true).finally(() => {
              loadingInProgressRef.current = false;
            });
          }
        }
      }, 60 * 1000);  // Check every minute
      
      return () => {
        console.log("Cleaning up refresh timer");
        clearInterval(refreshTimer);
      };
    }
  }, [loadPosts, lastLoad]);

  return {
    posts,
    loading,
    error,
    loadPosts, // Expose reload function
    readPostIds
  };
};
