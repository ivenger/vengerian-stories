
import { useState, useEffect, useCallback } from 'react';
import { Post } from '../types'; 
import { useAuth } from '../components/AuthProvider';

const useStoryFilters = () => {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const { user } = useAuth();
  const userId = user?.id;

  const updateActiveFilters = useCallback(() => {
    setHasActiveFilters(selectedTags.length > 0 || showUnreadOnly);
  }, [selectedTags, showUnreadOnly]);

  const onOpenFiltersDialog = () => {
    setIsFilterDialogOpen(true);
  };

  const onToggleTag = (tagId: string) => {
    setSelectedTags((prevSelectedTags) => {
      const newSelectedTags = prevSelectedTags.includes(tagId)
        ? prevSelectedTags.filter((id) => id !== tagId)
        : [...prevSelectedTags, tagId];
      return newSelectedTags;
    });
  };

  const onToggleUnreadFilter = () => {
    setShowUnreadOnly((prevShowUnreadOnly) => !prevShowUnreadOnly);
  };

  const onClearFilters = () => {
    setSelectedTags([]);
    setShowUnreadOnly(false);
  };

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/posts');
      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`);
      }

      const data = await response.json();
      setAllPosts(data);
    } catch (e: any) {
      setError(e.message || "Failed to fetch posts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch('/api/tags');
      if (!response.ok) {
        throw new Error(`Failed to fetch tags: ${response.status}`);
      }
      const tags = await response.json();
      setAllTags(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      setError("Failed to load tags.");
    }
  }, []);

  const onReloadPosts = () => {
    fetchPosts();
  };

  useEffect(() => {
    fetchPosts();
    fetchTags();
  }, [fetchPosts, fetchTags]);

  useEffect(() => {
    let newFilteredPosts = [...allPosts];

    if (selectedTags.length > 0) {
      newFilteredPosts = newFilteredPosts.filter((post) =>
        post.tags?.some((tag) => selectedTags.includes(tag))
      );
    }

    setFilteredPosts(newFilteredPosts);
    updateActiveFilters();
  }, [allPosts, selectedTags, updateActiveFilters]);

  useEffect(() => {
    const fetchReadingHistory = async () => {
      console.log("useStoryFilters: Fetching reading history", { userId });
      
      try {
        if (!userId) {
          console.log("useStoryFilters: No user ID, skipping reading history fetch");
          return;
        }

        const { getUserReadingHistory } = await import('../services/readingHistoryService');
        const readPosts = await getUserReadingHistory(userId);
        
        console.log("useStoryFilters: Reading history fetched", { count: readPosts.length });

        const readPostIds = new Set(readPosts.map(item => item.post_id));

        setFilteredPosts(prevFilteredPosts => {
          const updatedPosts = prevFilteredPosts.map(post => ({
            ...post,
            isRead: readPostIds.has(post.id),
          }));
          
          console.log("useStoryFilters: Posts updated with reading history", { updatedCount: updatedPosts.length });
          return updatedPosts;
        });
      } catch (error) {
        console.error("useStoryFilters: Error fetching reading history:", error);
        setError("Failed to load reading history.");
      }
    };

    if (userId && filteredPosts.length > 0) {
      console.log("useStoryFilters: User ID available, fetching reading history");
      fetchReadingHistory();
    } else {
      console.log("useStoryFilters: No User ID available or no filtered posts, skipping reading history fetch");
    }
  }, [userId, filteredPosts]);

  useEffect(() => {
    if (showUnreadOnly) {
      setFilteredPosts(prevPosts => {
        const unreadPosts = prevPosts.filter(post => !post.isRead);
        console.log("useStoryFilters: Filtered for unread posts", { unreadCount: unreadPosts.length });
        return unreadPosts;
      });
    } else {
      setFilteredPosts(allPosts => {
        let newFilteredPosts = [...allPosts];

        if (selectedTags.length > 0) {
          newFilteredPosts = newFilteredPosts.filter((post) =>
            post.tags?.some((tag) => selectedTags.includes(tag))
          );
        }
        
        console.log("useStoryFilters: Showing all posts, re-applying tag filters", { totalCount: newFilteredPosts.length });
        return newFilteredPosts;
      });
    }
    updateActiveFilters();
  }, [showUnreadOnly, selectedTags, allPosts, updateActiveFilters]);

  return {
    posts: filteredPosts,
    loading: isLoading,
    error,
    selectedTags,
    showUnreadOnly,
    allTags,
    hasActiveFilters,
    isFilterDialogOpen,
    onToggleTag,
    onToggleUnreadFilter,
    onClearFilters,
    onReloadPosts,
    setIsFilterDialogOpen,
    onOpenFiltersDialog
  };
};

export default useStoryFilters;
