
import { useState, useEffect, useCallback } from 'react';
import { BlogEntry } from '../types/blogTypes';
import { fetchFilteredPosts } from '../services/blogService';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

export const useStoryFilters = () => {
  const { user, refreshSession } = useAuth();
  const [posts, setPosts] = useState<BlogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readPostIds, setReadPostIds] = useState<string[]>([]);
  const { toast } = useToast();
  const [lastLoad, setLastLoad] = useState<number>(Date.now());
  const [sessionRefreshAttempted, setSessionRefreshAttempted] = useState<boolean>(false);

  // Fetch reading history if user is logged in
  useEffect(() => {
    if (!user) {
      setReadPostIds([]);
      return;
    }
    
    const fetchReadPosts = async () => {
      try {
        console.log("Fetching reading history for user:", user.id);
        const { data, error } = await supabase
          .from('reading_history')
          .select('*')
          .eq('user_id', user.id);
          
        if (error) {
          console.error("Error fetching reading history:", error);
          throw error;
        }
        
        console.log("Reading history fetched:", data?.length || 0, "items");
        setReadPostIds((data || []).map(item => item.post_id));
      } catch (err) {
        console.error("Error fetching reading history:", err);
        // Non-critical, don't set error state
      }
    };
    
    fetchReadPosts();
  }, [user]);

  // Fetch posts
  const loadPosts = useCallback(async (forceRefresh = false) => {
    console.log("loadPosts called with forceRefresh:", forceRefresh, "sessionRefreshAttempted:", sessionRefreshAttempted);
    
    setLoading(true);
    setError(null);
    setLastLoad(Date.now());
    
    // Always try to refresh session at the beginning regardless of user state
    if (!sessionRefreshAttempted || forceRefresh) {
      console.log("Attempting to refresh session before loading posts");
      await refreshSession();
      setSessionRefreshAttempted(true);
    }
    
    try {
      // Fetch all posts - with detailed logging to help debug
      console.log("Fetching all posts from postService");
      const allPosts = await fetchFilteredPosts();
      console.log(`Received ${allPosts?.length || 0} total posts from API`);
      
      if (!allPosts || allPosts.length === 0) {
        console.log("No posts returned from API - empty array or null");
        toast({
          title: "No stories found",
          description: "There are currently no published stories available.",
        });
      }
      
      setPosts(allPosts || []);
    } catch (error: any) {
      console.error("Failed to load posts:", error);
      
      // Handle specific error types more gracefully
      const errorMessage = error?.message || "Unknown error";
      console.log("Error message:", errorMessage);
      
      setError(
        errorMessage === "TypeError: Failed to fetch" 
          ? "Network error. Please check your connection and try again." 
          : "Failed to load stories. Please try again later."
      );
      setPosts([]);
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  }, [refreshSession, toast, sessionRefreshAttempted]);

  // Reset session refresh attempted flag when user changes
  useEffect(() => {
    setSessionRefreshAttempted(false);
  }, [user]);

  // Fetch posts on initial load
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
    
    return () => clearInterval(refreshTimer);
  }, [loadPosts, lastLoad]);

  return {
    posts,
    loading,
    error,
    loadPosts // Expose reload function
  };
};
