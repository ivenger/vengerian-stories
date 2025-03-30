
import { useEffect, useState } from 'react';
import { useReadPosts } from './useReadPosts';
import { usePostsLoader } from './usePostsLoader';

export const useStoryFilters = () => {
  const { posts, loading, error, loadPosts, lastLoad } = usePostsLoader();
  const { readPostIds } = useReadPosts();
  const [navigationCount, setNavigationCount] = useState(0);
  
  // Reset counter when page becomes visible after navigation
  useEffect(() => {
    console.log("Navigation effect - checking if page is visible after navigation");
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("Page became visible - triggering posts refresh");
        setNavigationCount(prev => prev + 1);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Check if we need to reload immediately
    const now = Date.now();
    if (now - lastLoad > 60 * 1000) { // 1 minute
      console.log("Initial load or stale data detected, refreshing posts");
      loadPosts(true);
    } else {
      console.log("Recent data found, not refreshing immediately");
    }
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadPosts, lastLoad]);
  
  // Secondary effect that responds to navigation counter changes
  useEffect(() => {
    if (navigationCount > 0) {
      console.log(`Navigation counter changed (${navigationCount}), reloading posts`);
      loadPosts(true);
    }
  }, [navigationCount, loadPosts]);
  
  // Initial fetch
  useEffect(() => {
    console.log("Initial post loading effect triggered");
    loadPosts();
    
    // Set up a refresh timer to avoid stale data
    const refreshTimer = setInterval(() => {
      const now = Date.now();
      if (now - lastLoad > 5 * 60 * 1000) {  // 5 minutes
        console.log("It's been a while since posts were loaded, refreshing");
        loadPosts(true);
      }
    }, 60 * 1000);  // Check every minute
    
    return () => {
      console.log("Cleaning up refresh timer");
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
