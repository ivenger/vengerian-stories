
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
