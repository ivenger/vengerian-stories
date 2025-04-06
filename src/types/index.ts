
// Export all types from other type files
export * from './blogTypes';
export * from './readingHistory';

// Import BlogEntry and re-export as Post for backward compatibility
import { BlogEntry } from './blogTypes';
export type Post = BlogEntry;
