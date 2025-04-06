
import { useState, useEffect, useCallback } from 'react';
import { BlogEntry } from '../types/blogTypes';
import { fetchFilteredPosts, fetchAllTags } from '../services/blogService';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "../components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

export const useStoryFilters = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [readPostIds, setReadPostIds] = useState<string[]>([]);
  const { toast } = useToast();

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
  const loadPosts = useCallback(async () => {
    console.log("loadPosts called with filters:", { 
      selectedTags, 
      showUnreadOnly, 
      userLoggedIn: !!user 
    });
    
    setLoading(true);
    setError(null);
    
    try {
      const tagsParam = selectedTags.length > 0 ? selectedTags : undefined;
      
      console.log("Filtering posts with tags:", tagsParam);
      
      const filteredPosts = await fetchFilteredPosts(tagsParam);
      console.log(`Received ${filteredPosts.length} posts from API`);
      
      // Apply read/unread filter if enabled
      let postsAfterReadFilter = filteredPosts;
      
      if (showUnreadOnly && user) {
        console.log("Filtering for unread posts, read IDs:", readPostIds);
        postsAfterReadFilter = filteredPosts.filter(post => !readPostIds.includes(post.id));
        console.log(`${postsAfterReadFilter.length} posts after unread filter`);
      }
        
      setPosts(postsAfterReadFilter);
    } catch (error: any) {
      console.error("Failed to load posts:", error);
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
  }, [selectedTags, showUnreadOnly, user, readPostIds]);

  // Fetch posts when filters change
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  const toggleUnreadFilter = () => {
    setShowUnreadOnly(!showUnreadOnly);
  };

  const clearFilters = () => {
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
