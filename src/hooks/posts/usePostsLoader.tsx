
import { useState, useCallback, useRef, useEffect } from 'react';
import { BlogEntry } from '../../types/blogTypes';
import { fetchFilteredPosts } from '../../services/post';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../../components/AuthProvider";

export const usePostsLoader = () => {
  const { user, refreshSession } = useAuth();
  const [posts, setPosts] = useState<BlogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [lastLoad, setLastLoad] = useState<number>(Date.now());
  const loadingRef = useRef(false); // Use ref to track actual loading state across renders
  const mountedRef = useRef(true);
  
  // Ensure clean unmounting
  useEffect(() => {
    console.log("usePostsLoader mounted");
    mountedRef.current = true;
    return () => {
      console.log("usePostsLoader unmounted - cleaning up");
      mountedRef.current = false;
      loadingRef.current = false; // Reset loading ref on unmount
    };
  }, []);
  
  // Fetch posts
  const loadPosts = useCallback(async (forceRefresh = false) => {
    console.log("loadPosts called with forceRefresh:", forceRefresh);
    
    // Prevent multiple simultaneous loads
    if (loadingRef.current) {
      console.log("Already loading posts, ignoring duplicate request");
      return Promise.resolve(false);
    }
    
    try {
      loadingRef.current = true;
      if (mountedRef.current) {
        setLoading(true);
        setError(null);
      }
      
      // If we've been loading for too long with a session, try refreshing it
      if (user && forceRefresh) {
        console.log("Refreshing user session before loading posts");
        await refreshSession();
      }
      
      // Fetch all published posts
      console.log("Fetching published posts from postService");
      const allPosts = await fetchFilteredPosts();
      
      // Check if component is still mounted before updating state
      if (!mountedRef.current) {
        console.log("Component unmounted during post load, abandoning updates");
        loadingRef.current = false;
        return false;
      }
      
      if (Array.isArray(allPosts)) {
        console.log(`Received ${allPosts.length} total posts from API`);
        setPosts(allPosts);
        
        if (allPosts.length === 0) {
          console.log("No posts returned from API - empty array");
          toast({
            title: "No stories found",
            description: "There are currently no published stories available.",
          });
        }
        
        return true;
      } else {
        console.error("Invalid response format from fetchFilteredPosts:", allPosts);
        setPosts([]);
        setError("Failed to load stories. Unexpected data format.");
        return false;
      }
    } catch (error: any) {
      console.error("Failed to load posts:", error);
      
      // Only update state if still mounted
      if (!mountedRef.current) {
        loadingRef.current = false;
        return false;
      }
      
      // Handle potential auth errors
      if (error?.message?.includes('JWT') || error?.message?.includes('token') || 
          error?.message?.includes('auth') || error?.message?.includes('authentication')) {
        console.log("Detected potential auth error, attempting session refresh");
        if (user) {
          const refreshed = await refreshSession();
          if (refreshed) {
            // If refresh successful, try loading posts again
            console.log("Session refreshed, retrying post load");
            loadingRef.current = false;
            return loadPosts(false);
          }
        }
      }
      
      setError(
        error?.message === "TypeError: Failed to fetch" 
          ? "Network error. Please check your connection and try again." 
          : "Failed to load stories. Please try again later."
      );
      setPosts([]);
      return false;
    } finally {
      // Only update state if still mounted
      if (mountedRef.current) {
        console.log("Setting loading to false");
        setLoading(false);
        setLastLoad(Date.now());
      }
      loadingRef.current = false;
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
