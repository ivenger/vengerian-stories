
import { useState, useCallback, useRef } from 'react';
import { BlogEntry } from '../../types/blogTypes';
import { fetchFilteredPosts } from '../../services/post/postQueryService';

export const usePostsLoader = () => {
  const [posts, setPosts] = useState<BlogEntry[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const lastLoad = useRef<Date | null>(null);
  const isLoadingRef = useRef<boolean>(false);

  const loadPosts = useCallback(async (forceRefresh: boolean = false, tags?: string[]) => {
    // Don't re-fetch if we already have posts, it's not a forced refresh, and it's been less than 5 minutes
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    if (!forceRefresh && 
        posts && 
        posts.length > 0 && 
        lastLoad.current && 
        lastLoad.current > fiveMinutesAgo &&
        !tags?.length) {
      console.log("Using cached posts - last load was recent");
      return posts;
    }

    // Skip if already loading
    if (isLoadingRef.current) {
      console.log("Already loading posts, skipping");
      return null;
    }

    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    
    console.log(`Loading posts with tags:`, tags);
    
    try {
      const fetchedPosts = await fetchFilteredPosts(tags);
      setPosts(fetchedPosts);
      lastLoad.current = new Date();
      console.log(`Loaded ${fetchedPosts.length} posts`);
      return fetchedPosts;
    } catch (err) {
      console.error("Error loading posts:", err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [posts]);

  return {
    posts,
    loading,
    error,
    loadPosts,
    lastLoad: lastLoad.current
  };
};
