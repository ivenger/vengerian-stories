
import { useState, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { BlogEntry } from '@/types/blogTypes';
import { fetchPostsWithFallback } from '@/services/blogService';
import { useSessionRefresh } from './useSessionRefresh';

export const usePostsLoading = (user: User | null) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastLoad, setLastLoad] = useState<number>(Date.now());
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const fetchInProgressRef = useRef(false);
  const { refreshSession } = useSessionRefresh();

  const loadPosts = useCallback(async (
    selectedTags: string[] = [],
    forceRefresh = false
  ): Promise<BlogEntry[]> => {
    if (fetchInProgressRef.current && !forceRefresh) {
      console.log("Fetch already in progress, skipping non-forced fetch");
      return [];
    }

    fetchInProgressRef.current = true;
    setLoading(true);
    setError(null);
    setLastLoad(Date.now());
    
    try {
      if (user && forceRefresh) {
        try {
          console.log("Attempting to refresh session before fetching posts");
          await refreshSession();
        } catch (e) {
          console.warn("Failed to refresh session, proceeding anyway:", e);
        }
      }
      
      console.log(`Fetching posts with tags:`, selectedTags);
      const allPosts = await fetchPostsWithFallback(
        selectedTags.length > 0 ? selectedTags : undefined
      );
      
      if (Array.isArray(allPosts)) {
        console.log(`Successfully loaded ${allPosts.length} posts`);
        setRetryCount(0);
        setIsRetrying(false);
        setLoading(false);
        setError(null);
        return allPosts;
      } else {
        throw new Error("Invalid posts data returned");
      }
    } catch (error: any) {
      console.error("Failed to load posts:", error);
      setRetryCount((prev) => prev + 1);
      setIsRetrying(false);
      setLoading(false);
      setError("Unable to load stories. Please check your connection and try again.");
      return [];
    } finally {
      fetchInProgressRef.current = false;
    }
  }, [user, refreshSession]);

  return {
    loading,
    error,
    lastLoad,
    retryCount,
    isRetrying,
    loadPosts
  };
};
