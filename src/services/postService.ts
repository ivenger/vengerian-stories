
// Re-export all post-related functions from their respective modules
export {
  fetchAllPosts
} from './posts/adminService';

export {
  fetchPostById,
  fetchFilteredPosts
} from './posts/postOperations';

export {
  savePost,
  deletePost
} from './posts/postManagement';

export {
  markPostAsRead,
  hasReadPost
} from './posts/readingService';
