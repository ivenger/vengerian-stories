
import { useState, useEffect, useCallback } from 'react';
import { BlogEntry } from '../types/blogTypes';
import { fetchFilteredPosts, fetchAllTags } from '../services/blogService';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "../components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

export const useStoryFilters = () => {
  const { user, refreshSession } = useAuth();
  const [posts, setPosts] = useState<BlogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [readPostIds, setReadPostIds] = useState<string[]>([]);
  const { toast } = useToast();
  const [lastLoad, setLastLoad] = useState<number>(Date.now());
  const [originalPosts, setOriginalPosts] = useState<BlogEntry[]>([]); // Store unfiltered posts

  // Load saved filters from localStorage on initial render
  useEffect(() => {
    const savedTags = localStorage.getItem('selectedTags');
    const savedUnreadFilter = localStorage.getItem('showUnreadOnly');
    
    if (savedTags) {
      try {
        setSelectedTags(JSON.parse(savedTags));
      } catch (e) {
        console.error("Error parsing saved tags:", e);
        localStorage.removeItem('selectedTags');
      }
    }
    
    if (savedUnreadFilter && user) {
      try {
        setShowUnreadOnly(JSON.parse(savedUnreadFilter));
      } catch (e) {
        console.error("Error parsing saved unread filter:", e);
        localStorage.removeItem('showUnreadOnly');
      }
    }
  }, [user]);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('selectedTags', JSON.stringify(selectedTags));
      
      if (user) {
        localStorage.setItem('showUnreadOnly', JSON.stringify(showUnreadOnly));
      }
    } catch (e) {
      console.error("Error saving filters to localStorage:", e);
    }
  }, [selectedTags, showUnreadOnly, user]);

  // Fetch reading history if user is logged in
  useEffect(() => {
    if (!user) {
      setReadPostIds([]);
      setShowUnreadOnly(false);
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

  // Fetch all available tags
  useEffect(() => {
    const loadTags = async () => {
      try {
        console.log("Fetching all tags...");
        const tags = await fetchAllTags();
        console.log("Tags fetched successfully:", tags);
        setAllTags(tags);
      } catch (error) {
        console.error("Failed to load tags:", error);
        // Don't set error state for tags failure as it's not critical
      }
    };
    loadTags();
  }, []);

  // Fetch posts based on selected filters
  const loadPosts = useCallback(async (forceRefresh = false) => {
    console.log("loadPosts called with filters:", { 
      selectedTags, 
      showUnreadOnly, 
      userLoggedIn: !!user,
      forceRefresh
    });
    
    setLoading(true);
    setError(null);
    setLastLoad(Date.now());
    
    try {
      // If we've been loading for too long with a session, try refreshing it
      if (user && forceRefresh) {
        await refreshSession();
      }
      
      // Always fetch all posts first
      console.log("Fetching all posts");
      const allPosts = await fetchFilteredPosts();
      console.log(`Received ${allPosts.length} total posts from API`);
      setOriginalPosts(allPosts);
      
      // Then apply filters if needed
      let filteredPosts = allPosts;
      
      if (selectedTags.length > 0) {
        console.log("Filtering by tags:", selectedTags);
        filteredPosts = allPosts.filter(post => {
          if (!post.tags) return false;
          return selectedTags.some(tag => post.tags?.includes(tag));
        });
        console.log(`${filteredPosts.length} posts after tag filtering`);
      }
      
      // Apply read/unread filter if enabled
      if (showUnreadOnly && user) {
        console.log("Filtering for unread posts, read IDs:", readPostIds);
        filteredPosts = filteredPosts.filter(post => !readPostIds.includes(post.id));
        console.log(`${filteredPosts.length} posts after unread filter`);
      }
        
      setPosts(filteredPosts);
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
  }, [selectedTags, showUnreadOnly, user, readPostIds, refreshSession]);

  // Apply filters locally when they change, without re-fetching
  useEffect(() => {
    if (originalPosts.length > 0 && !loading) {
      console.log("Applying filters locally to cached posts");
      
      let filteredPosts = originalPosts;
      
      if (selectedTags.length > 0) {
        console.log("Filtering locally by tags:", selectedTags);
        filteredPosts = originalPosts.filter(post => {
          if (!post.tags) return false;
          return selectedTags.some(tag => post.tags?.includes(tag));
        });
      }
      
      if (showUnreadOnly && user) {
        console.log("Filtering locally for unread posts");
        filteredPosts = filteredPosts.filter(post => !readPostIds.includes(post.id));
      }
      
      console.log(`Local filtering resulted in ${filteredPosts.length} posts`);
      setPosts(filteredPosts);
    }
  }, [selectedTags, showUnreadOnly, originalPosts, readPostIds, user]);

  // Fetch posts on initial load
  useEffect(() => {
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

  const toggleTag = (tag: string) => {
    console.log(`Toggling tag: ${tag}`);
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };
  
  const toggleUnreadFilter = () => {
    setShowUnreadOnly(!showUnreadOnly);
  };

  const clearFilters = () => {
    console.log("Clearing all filters");
    setSelectedTags([]);
    setShowUnreadOnly(false);
  };

  const hasActiveFilters = selectedTags.length > 0 || showUnreadOnly;

  return {
    posts,
    loading,
    error,
    allTags,
    selectedTags,
    showUnreadOnly,
    toggleTag,
    toggleUnreadFilter,
    clearFilters,
    hasActiveFilters,
    loadPosts // Expose reload function
  };
};
