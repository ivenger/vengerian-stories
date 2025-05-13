
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { BlogEntry } from '@/types/blogTypes';
import { applyFiltersToData } from './filterUtils';

export const useFilterState = (user: User | null) => {
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [posts, setPosts] = useState<BlogEntry[]>([]);
  const [originalPosts, setOriginalPosts] = useState<BlogEntry[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // Load saved unread filter from localStorage on initial render
  useEffect(() => {
    const savedUnreadFilter = localStorage.getItem('showUnreadOnly');
    const savedLanguages = localStorage.getItem('selectedLanguages');
    
    if (savedUnreadFilter && user) {
      try {
        setShowUnreadOnly(JSON.parse(savedUnreadFilter));
      } catch (e) {
        console.error("Error parsing saved unread filter:", e);
        localStorage.removeItem('showUnreadOnly');
      }
    }
    
    if (savedLanguages && user) {
      try {
        setSelectedLanguages(JSON.parse(savedLanguages));
      } catch (e) {
        console.error("Error parsing saved language filters:", e);
        localStorage.removeItem('selectedLanguages');
      }
    }
  }, [user]);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('showUnreadOnly', JSON.stringify(showUnreadOnly));
        localStorage.setItem('selectedLanguages', JSON.stringify(selectedLanguages));
      }
    } catch (e) {
      console.error("Error saving filters to localStorage:", e);
    }
  }, [showUnreadOnly, selectedLanguages, user]);

  const toggleUnreadFilter = () => {
    setShowUnreadOnly(!showUnreadOnly);
  };

  const toggleLanguage = (language: string) => {
    console.log(`Toggling language: ${language}`);
    setSelectedLanguages(prev => 
      prev.includes(language) 
        ? prev.filter(l => l !== language)
        : [...prev, language]
    );
  };

  const updateFilteredPosts = (
    postsToFilter: BlogEntry[],
    tags: string[],
    readPostIds: string[]
  ) => {
    console.log(`[${new Date().toISOString()}] Updating filtered posts with languages:`, selectedLanguages);
    setOriginalPosts(postsToFilter);
    setSelectedTags(tags);
    const filteredPosts = applyFiltersToData(
      postsToFilter,
      tags,
      showUnreadOnly,
      readPostIds,
      user,
      selectedLanguages
    );
    setPosts(filteredPosts);
  };

  const clearAllFilters = () => {
    console.log(`[${new Date().toISOString()}] Clearing all filters`);
    setSelectedTags([]);
    setSelectedLanguages([]);
    setShowUnreadOnly(false);
  };

  return {
    posts,
    originalPosts,
    showUnreadOnly,
    selectedLanguages,
    toggleLanguage,
    toggleUnreadFilter,
    updateFilteredPosts,
    clearAllFilters
  };
};
