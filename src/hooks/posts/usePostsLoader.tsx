
import { useState, useCallback } from 'react';
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

  // Fetch posts
  const loadPosts = useCallback(async (forceRefresh = false) => {
    console.log("loadPosts called with forceRefresh:", forceRefresh);
    
    setLoading(true);
    setError(null);
    setLastLoad(Date.now());
    
    try {
      // If we've been loading for too long with a session, try refreshing it
      if (user && forceRefresh) {
        console.log("Refreshing user session before loading posts");
        await refreshSession();
      }
      
      // Fetch all published posts
      console.log("Fetching published posts from postService");
      const allPosts = await fetchFilteredPosts();
      
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
      } else {
        console.error("Invalid response format from fetchFilteredPosts:", allPosts);
        setPosts([]);
        setError("Failed to load stories. Unexpected data format.");
      }
    } catch (error: any) {
      console.error("Failed to load posts:", error);
      
      // Handle potential auth errors
      if (error?.message?.includes('JWT') || error?.message?.includes('token') || 
          error?.message?.includes('auth') || error?.message?.includes('authentication')) {
        console.log("Detected potential auth error, attempting session refresh");
        if (user) {
          const refreshed = await refreshSession();
          if (refreshed) {
            // If refresh successful, try loading posts again
            console.log("Session refreshed, retrying post load");
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
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
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
