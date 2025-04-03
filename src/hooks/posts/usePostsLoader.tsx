import { useState, useCallback, useRef, useEffect } from 'react';
import { BlogEntry } from '../../types/blogTypes';
import { fetchFilteredPosts } from '../../services/post';
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "../../components/AuthProvider";

export const usePostsLoader = () => {
  const { user, refreshSession } = useAuthContext();
  const [posts, setPosts] = useState<BlogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [lastLoad, setLastLoad] = useState<number>(Date.now());
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);
  const requestInProgressRef = useRef<AbortController | null>(null);
  
  useEffect(() => {
    console.log("usePostsLoader mounted");
    mountedRef.current = true;
    loadingRef.current = false;
    
    return () => {
      console.log("usePostsLoader unmounted - cleaning up");
      mountedRef.current = false;
      loadingRef.current = false;
      
      if (requestInProgressRef.current) {
        console.log("Aborting in-progress fetch requests");
        requestInProgressRef.current.abort();
        requestInProgressRef.current = null;
      }
      
      setPosts([]);
      setError(null);
      setLoading(false);
    };
  }, []);
  
  useEffect(() => {
    if (!mountedRef.current) return;
    
    setError(null);
  }, [user]);
  
  const loadPosts = useCallback(async (forceRefresh = false) => {
    console.log("loadPosts called with forceRefresh:", forceRefresh);
    
    if (loadingRef.current) {
      console.log("Already loading posts, ignoring duplicate request");
      return Promise.resolve(false);
    }
    
    if (requestInProgressRef.current) {
      requestInProgressRef.current.abort();
    }
    
    requestInProgressRef.current = new AbortController();
    const signal = requestInProgressRef.current.signal;
    
    try {
      loadingRef.current = true;
      if (mountedRef.current) {
        setLoading(true);
        setError(null);
      }
      
      if (user && forceRefresh) {
        console.log("Refreshing user session before loading posts");
        await refreshSession();
      }
      
      console.log("Fetching published posts from postService");
      const allPosts = await fetchFilteredPosts();
      
      if (!mountedRef.current) {
        console.log("Component unmounted during post load, abandoning updates");
        loadingRef.current = false;
        return false;
      }
      
      if (signal.aborted) {
        console.log("Request was aborted, abandoning updates");
        return false;
      }
      
      if (Array.isArray(allPosts)) {
        console.log(`Received ${allPosts.length} total posts from API`);
        if (mountedRef.current) {
          setPosts(allPosts);
        }
        
        if (allPosts.length === 0) {
          console.log("No posts returned from API - empty array");
          if (mountedRef.current) {
            toast({
              title: "No stories found",
              description: "There are currently no published stories available.",
            });
          }
        }
        
        return true;
      } else {
        console.error("Invalid response format from fetchFilteredPosts:", allPosts);
        if (mountedRef.current) {
          setPosts([]);
          setError("Failed to load stories. Unexpected data format.");
        }
        return false;
      }
    } catch (error: any) {
      if (!mountedRef.current || signal.aborted) {
        loadingRef.current = false;
        return false;
      }
      
      console.error("Failed to load posts:", error);
      
      if (error?.message?.includes('JWT') || error?.message?.includes('token') || 
          error?.message?.includes('auth') || error?.message?.includes('authentication')) {
        console.log("Detected potential auth error, attempting session refresh");
        if (user) {
          try {
            const refreshed = await refreshSession();
            if (refreshed) {
              console.log("Session refreshed, retrying post load");
              loadingRef.current = false;
              return loadPosts(false);
            }
          } catch (refreshError) {
            console.error("Session refresh failed:", refreshError);
          }
        }
      }
      
      if (mountedRef.current) {
        setError(
          error?.message === "TypeError: Failed to fetch" 
            ? "Network error. Please check your connection and try again." 
            : "Failed to load stories. Please try again later."
        );
        setPosts([]);
      }
      return false;
    } finally {
      if (mountedRef.current && !signal.aborted) {
        console.log("Setting loading to false");
        setLoading(false);
        setLastLoad(Date.now());
      }
      
      loadingRef.current = false;
      
      if (requestInProgressRef.current && requestInProgressRef.current.signal === signal) {
        requestInProgressRef.current = null;
      }
    }
  }, [user, refreshSession, toast]);
  
  return {
    posts,
    loading,
    error,
    loadPosts,
    lastLoad
  };
};
