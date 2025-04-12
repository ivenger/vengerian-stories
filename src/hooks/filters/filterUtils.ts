
import { BlogEntry } from '../../types/blogTypes';

/**
 * Apply tag and read/unread filters to posts
 */
export const applyFiltersToData = (
  postsToFilter: BlogEntry[],
  selectedTags: string[],
  showUnreadOnly: boolean,
  readPostIds: string[],
  user: any | null
) => {
  console.log("Applying filters to posts", {
    totalPosts: postsToFilter.length,
    selectedTags,
    showUnreadOnly,
    readIdsCount: readPostIds.length
  });
  
  let filteredPosts = [...postsToFilter];
  
  if (selectedTags.length > 0) {
    console.log("Filtering by tags:", selectedTags);
    filteredPosts = filteredPosts.filter(post => {
      if (!post.tags) return false;
      return selectedTags.some(tag => post.tags?.includes(tag));
    });
    console.log(`${filteredPosts.length} posts after tag filtering`);
  }
  
  // Apply read/unread filter if enabled
  if (showUnreadOnly && user) {
    console.log("Filtering for unread posts, read IDs count:", readPostIds.length);
    filteredPosts = filteredPosts.filter(post => !readPostIds.includes(post.id));
    console.log(`${filteredPosts.length} posts after unread filter`);
  }
  
  return filteredPosts;
};

/**
 * Calculate backoff delay for retries with exponential backoff
 */
export const getBackoffDelay = (retryAttempt: number) => {
  // Start with a 2 second delay and double each time, max 30 seconds
  const baseDelay = 2000;
  const delay = Math.min(baseDelay * Math.pow(2, retryAttempt), 30000);
  // Add a bit of randomness to avoid all clients retrying at the same time
  return delay + (Math.random() * 1000);
};
