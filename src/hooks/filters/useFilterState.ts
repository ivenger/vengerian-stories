
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { BlogEntry } from '@/types/blogTypes';
import { applyFiltersToData } from './filterUtils';

export const useFilterState = (user: User | null) => {
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [posts, setPosts] = useState<BlogEntry[]>([]);
  const [originalPosts, setOriginalPosts] = useState<BlogEntry[]>([]);

  // Load saved unread filter from localStorage on initial render
  useEffect(() => {
    const savedUnreadFilter = localStorage.getItem('showUnreadOnly');
    
    if (savedUnreadFilter && user) {
      try {
        setShowUnreadOnly(JSON.parse(savedUnreadFilter));
      } catch (e) {
        console.error("Error parsing saved unread filter:", e);
        localStorage.removeItem('showUnreadOnly');
      }
    }
  }, [user]);

  // Save unread filter to localStorage whenever it changes
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('showUnreadOnly', JSON.stringify(showUnreadOnly));
      }
    } catch (e) {
      console.error("Error saving unread filter to localStorage:", e);
    }
  }, [showUnreadOnly, user]);

  const toggleUnreadFilter = () => {
    setShowUnreadOnly(!showUnreadOnly);
  };

  const updateFilteredPosts = (
    postsToFilter: BlogEntry[],
    selectedTags: string[],
    readPostIds: string[]
  ) => {
    setOriginalPosts(postsToFilter);
    const filteredPosts = applyFiltersToData(
      postsToFilter,
      selectedTags,
      showUnreadOnly,
      readPostIds,
      user
    );
    setPosts(filteredPosts);
  };

  return {
    posts,
    originalPosts,
    showUnreadOnly,
    toggleUnreadFilter,
    updateFilteredPosts
  };
};
