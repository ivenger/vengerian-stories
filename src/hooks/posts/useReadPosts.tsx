
import { useState, useEffect, useRef } from 'react';

export const useReadPosts = () => {
  const [readPostIds, setReadPostIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);
  
  useEffect(() => {
    console.log("useReadPosts mounted");
    mountedRef.current = true;
    
    // Try to load read posts from localStorage
    try {
      const storedReadPosts = localStorage.getItem('readPosts');
      if (storedReadPosts) {
        setReadPostIds(JSON.parse(storedReadPosts));
        console.log("Loaded read posts from localStorage:", JSON.parse(storedReadPosts));
      }
    } catch (error) {
      console.error("Failed to load read posts from localStorage:", error);
    }
    
    return () => {
      console.log("useReadPosts unmounted - cleaning up");
      mountedRef.current = false;
    };
  }, []);

  const markPostAsRead = (postId: string) => {
    if (!postId || readPostIds.includes(postId)) return;
    
    const newReadPostIds = [...readPostIds, postId];
    setReadPostIds(newReadPostIds);
    
    // Save to localStorage
    try {
      localStorage.setItem('readPosts', JSON.stringify(newReadPostIds));
      console.log("Saved read post to localStorage:", postId);
    } catch (error) {
      console.error("Failed to save read post to localStorage:", error);
    }
  };

  return {
    readPostIds,
    isReadPostsLoading: loading,
    hasReadPost: (postId: string) => readPostIds.includes(postId),
    markPostAsRead,
    clearReadPosts: () => {
      setReadPostIds([]);
      localStorage.removeItem('readPosts');
      console.log("Cleared read posts");
    }
  };
};
