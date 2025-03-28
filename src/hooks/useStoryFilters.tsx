
import { useState, useEffect, useCallback } from 'react';
import { BlogEntry } from '../types/blogTypes';
import { fetchFilteredPosts } from '../services/postService';
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
    console.log("loadPosts called");
    
    setLoading(true);
    setError(null);
    setLastLoad(Date.now());
    
    try {
      // If we've been loading for too long with a session, try refreshing it
      if (user && forceRefresh) {
        await refreshSession();
      }
      
      // Fetch all posts - with detailed logging to help debug
      console.log("Fetching all posts from postService");
      const allPosts = await fetchFilteredPosts();
      console.log(`Received ${allPosts?.length || 0} total posts from API:`, allPosts);
      
      if (!allPosts || allPosts.length === 0) {
        console.log("No posts returned from API - empty array or null");
      }
      
      setPosts(allPosts || []);
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
  }, [user, refreshSession]);

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
