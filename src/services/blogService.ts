
// Re-export all functions from individual service files, with explicit handling of conflicting exports
export * from './tagService';
export * from './aboutService';
export * from './imageService';
export * from './readingHistoryService';

// Selectively re-export from postService to avoid naming conflicts
export { 
  fetchAllPosts, 
  fetchPostById, 
  fetchFilteredPosts, 
  savePost, 
  deletePost 
} from './postService';

// Explicitly rename the markPostAsRead to avoid conflict
export { markPostAsRead as markPostAsReadFromPostService } from './postService';

// Add a utility function to fetch posts with better error handling
export const fetchPostsWithFallback = async (tags?: string[]) => {
  try {
    return await fetchFilteredPosts(tags);
  } catch (error) {
    console.error("Error fetching posts with primary method:", error);
    
    // Return empty array as fallback when API fails
    return [];
  }
};
