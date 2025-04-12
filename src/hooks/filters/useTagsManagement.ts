
import { useState, useEffect } from 'react';
import { fetchAllTags } from '../../services/blogService';

/**
 * Hook to fetch and manage tags
 */
export const useTagsManagement = () => {
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Load saved filters from localStorage on initial render
  useEffect(() => {
    const savedTags = localStorage.getItem('selectedTags');
    
    if (savedTags) {
      try {
        setSelectedTags(JSON.parse(savedTags));
      } catch (e) {
        console.error("Error parsing saved tags:", e);
        localStorage.removeItem('selectedTags');
      }
    }
  }, []);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('selectedTags', JSON.stringify(selectedTags));
    } catch (e) {
      console.error("Error saving tags to localStorage:", e);
    }
  }, [selectedTags]);

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
      }
    };
    
    loadTags();
  }, []);

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

  const clearTags = () => {
    setSelectedTags([]);
  };

  return {
    allTags,
    selectedTags,
    toggleTag,
    clearTags
  };
};
