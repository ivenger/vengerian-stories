
import { useState, useEffect, useContext } from 'react';
import { BlogEntry } from '../types/blogTypes';
import { fetchFilteredPosts, fetchAllTags } from '../services/blogService';
import { useToast } from "@/components/ui/use-toast";
import { LanguageContext } from "../App";

export const useStoryFilters = () => {
  const { currentLanguage } = useContext(LanguageContext);
  const [posts, setPosts] = useState<BlogEntry[]>([]);
  const [loading, setLoading] = useState(true);
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
      setSelectedTags(JSON.parse(savedTags));
    }
    if (savedLanguages) {
      setSelectedLanguages(JSON.parse(savedLanguages));
    } else {
      setSelectedLanguages([currentLanguage]);
    }
  }, []);

  // When current language changes, update the selected languages filter
  // but only if no language has been explicitly selected by the user
  useEffect(() => {
    if (selectedLanguages.length === 0) {
      setSelectedLanguages([currentLanguage]);
    }
  }, [currentLanguage]);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('selectedTags', JSON.stringify(selectedTags));
    localStorage.setItem('selectedLanguages', JSON.stringify(selectedLanguages));
  }, [selectedTags, selectedLanguages]);

  // Fetch all available tags
  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await fetchAllTags();
        setAllTags(tags);
      } catch (error) {
        console.error("Failed to load tags:", error);
      }
    };
    loadTags();
  }, []);

  // Fetch posts based on selected filters
  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        const tagsToFilter = selectedTags.length > 0 ? selectedTags : undefined;
        const langsToFilter = selectedLanguages.length > 0 ? selectedLanguages : undefined;
        const filteredPosts = await fetchFilteredPosts(tagsToFilter, langsToFilter);
        setPosts(filteredPosts);
      } catch (error) {
        console.error("Failed to load posts:", error);
        toast({
          title: "Error",
          description: "Failed to load blog posts. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, [selectedTags, selectedLanguages, toast]);

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
      setSelectedLanguages(newSelection);
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
    allTags,
    selectedTags,
    selectedLanguages,
    toggleTag,
    toggleLanguage,
    clearFilters,
    hasActiveFilters,
    languages
  };
};
