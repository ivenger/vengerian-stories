
import { useState, useEffect, useContext, useCallback } from 'react';
import { BlogEntry } from '../types/blogTypes';
import { fetchFilteredPosts, fetchAllTags } from '../services/blogService';
import { useToast } from "@/components/ui/use-toast";
import { LanguageContext } from "../App";

export const useStoryFilters = () => {
  const { currentLanguage } = useContext(LanguageContext);
  const [posts, setPosts] = useState<BlogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const { toast } = useToast();
  const languages = ["English", "Hebrew", "Russian"];

  // Load saved filters from localStorage on initial render
  useEffect(() => {
    const savedTags = localStorage.getItem('selectedTags');
    const savedLanguages = localStorage.getItem('selectedLanguages');
    if (savedTags) {
      try {
        setSelectedTags(JSON.parse(savedTags));
      } catch (e) {
        console.error("Error parsing saved tags:", e);
        localStorage.removeItem('selectedTags');
      }
    }
    if (savedLanguages) {
      try {
        setSelectedLanguages(JSON.parse(savedLanguages));
      } catch (e) {
        console.error("Error parsing saved languages:", e);
        localStorage.removeItem('selectedLanguages');
        setSelectedLanguages([currentLanguage]);
      }
    } else {
      setSelectedLanguages([currentLanguage]);
    }
  }, [currentLanguage]);

  // When current language changes, update the selected languages filter
  // but only if no language has been explicitly selected by the user
  useEffect(() => {
    if (selectedLanguages.length === 0) {
      setSelectedLanguages([currentLanguage]);
    }
  }, [currentLanguage, selectedLanguages]);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('selectedTags', JSON.stringify(selectedTags));
      localStorage.setItem('selectedLanguages', JSON.stringify(selectedLanguages));
    } catch (e) {
      console.error("Error saving filters to localStorage:", e);
    }
  }, [selectedTags, selectedLanguages]);

  // Fetch all available tags
  useEffect(() => {
    const loadTags = async () => {
      try {
        setError(null);
        const tags = await fetchAllTags();
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
    try {
      setLoading(true);
      setError(null);
      
      // Ensure we have valid arrays for filtering
      const tagsToFilter = Array.isArray(selectedTags) && selectedTags.length > 0 ? selectedTags : undefined;
      const langsToFilter = Array.isArray(selectedLanguages) && selectedLanguages.length > 0 ? selectedLanguages : undefined;
      
      console.log("Filtering posts with tags:", tagsToFilter, "and languages:", langsToFilter);
      
      const filteredPosts = await fetchFilteredPosts(tagsToFilter, langsToFilter);
      setPosts(filteredPosts);
    } catch (error: any) {
      console.error("Failed to load posts:", error);
      setError(
        error?.message === "TypeError: Failed to fetch" 
          ? "Network error. Please check your connection and try again." 
          : "Failed to load stories. Please try again later."
      );
      // Only clear posts if we have an error and no existing posts
      if (posts.length === 0) {
        setPosts([]);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedTags, selectedLanguages, posts.length]);

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

  const toggleLanguage = (language: string) => {
    if (selectedLanguages.includes(language)) {
      const newSelection = selectedLanguages.filter(l => l !== language);
      setSelectedLanguages(newSelection.length > 0 ? newSelection : [currentLanguage]);
    } else {
      setSelectedLanguages([...selectedLanguages, language]);
    }
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSelectedLanguages([currentLanguage]);
  };

  const hasActiveFilters = selectedTags.length > 0 || 
    selectedLanguages.length !== 1 || 
    (selectedLanguages.length === 1 && selectedLanguages[0] !== currentLanguage);

  return {
    posts,
    loading,
    error,
    allTags,
    selectedTags,
    selectedLanguages,
    toggleTag,
    toggleLanguage,
    clearFilters,
    hasActiveFilters,
    languages,
    loadPosts // Expose reload function
  };
};
