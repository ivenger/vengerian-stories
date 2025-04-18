
// Re-export all functions from individual service files, with explicit handling of conflicting exports
export * from './postService';
export * from './tagService';
export * from './aboutService';
export * from './imageService';
export * from './readingHistoryService';

// Explicitly rename the markPostAsRead if needed
export { markPostAsRead as markPostAsReadFromPostService } from './postService';
