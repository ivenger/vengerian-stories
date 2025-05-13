
import { BlogEntry } from '../../types/blogTypes';

/**
 * Apply tag and read/unread filters to posts
 */
export const applyFiltersToData = (
  postsToFilter: BlogEntry[],
  selectedTags: string[],
  showUnreadOnly: boolean,
  readPostIds: string[],
  user: any | null,
  selectedLanguages: string[] = []
) => {
  console.log(`[${new Date().toISOString()}] Applying filters to posts`, {
    totalPosts: postsToFilter.length,
    selectedTags,
    selectedLanguages,
    showUnreadOnly,
    readIdsCount: readPostIds.length
  });
  
  let filteredPosts = [...postsToFilter];
  
  // Apply tag filtering
  if (selectedTags.length > 0) {
    console.log(`[${new Date().toISOString()}] Filtering by tags:`, selectedTags);
    filteredPosts = filteredPosts.filter(post => {
      if (!post.tags) return false;
      return selectedTags.some(tag => post.tags?.includes(tag));
    });
    console.log(`[${new Date().toISOString()}] ${filteredPosts.length} posts after tag filtering`);
  }
  
  // Apply language filtering
  if (selectedLanguages.length > 0) {
    console.log(`[${new Date().toISOString()}] Filtering by languages:`, selectedLanguages);
    filteredPosts = filteredPosts.filter(post => {
      if (!post.language) return false;
      return selectedLanguages.some(lang => post.language.includes(lang));
    });
    console.log(`[${new Date().toISOString()}] ${filteredPosts.length} posts after language filtering`);
  }
  
  // Apply read/unread filter if enabled
  if (showUnreadOnly && user) {
    console.log(`[${new Date().toISOString()}] Filtering for unread posts, read IDs count:`, readPostIds.length);
    filteredPosts = filteredPosts.filter(post => !readPostIds.includes(post.id));
    console.log(`[${new Date().toISOString()}] ${filteredPosts.length} posts after unread filter`);
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

/**
 * Helper to check if array contains at least one element from another array
 */
export const containsAny = (source: string[] | undefined, target: string[]): boolean => {
  if (!source || source.length === 0 || target.length === 0) return false;
  return target.some(item => source.includes(item));
};

/**
 * Check if we should retry a Supabase request based on error details
 */
export const shouldRetryRequest = (error: any): boolean => {
  if (!error) return false;
  
  // Network errors or connection issues
  if (error.message?.includes('Failed to fetch') || 
      error.message?.includes('Network') ||
      error.message?.includes('connection')) {
    return true;
  }
  
  // Possible auth errors
  if (error.code === '401' || 
      error.message?.includes('JWT') ||
      error.message?.includes('token') ||
      error.message?.includes('auth')) {
    return true;
  }
  
  return false;
};
