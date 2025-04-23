
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

// Import what we need from postService
import { fetchFilteredPosts } from './postService';
import { supabase } from '@/integrations/supabase/client';

/**
 * Fallback function to fetch posts with better error handling and timeout protection
 * This function will catch errors from fetchFilteredPosts and provide fallbacks
 */
export const fetchPostsWithFallback = async (tags?: string[]) => {
  console.log("fetchPostsWithFallback called with tags:", tags);
  
  try {
    // Create a timeout promise to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Fetch timeout exceeded')), 8000);
    });
    
    // Race between the actual fetch and the timeout
    const posts = await Promise.race([
      fetchFilteredPosts(tags),
      timeoutPromise
    ]);
    
    console.log(`Successfully fetched ${posts.length} posts`);
    return posts;
  } catch (error) {
    console.error("Error in fetchPostsWithFallback:", error);
    
    // Try direct Supabase query as last resort
    try {
      console.log("Attempting direct Supabase query as fallback");
      
      let query = supabase
        .from('entries')
        .select('*')
        .eq('status', 'published')
        .order('date', { ascending: false });
      
      if (tags && tags.length > 0) {
        query = query.contains('tags', tags);
      }
      
      // Set a shorter timeout for this query
      const { data, error } = await query.abortSignal(AbortSignal.timeout(5000));
      
      if (error) throw error;
      
      console.log(`Fallback query returned ${data?.length || 0} posts`);
      return data || [];
    } catch (fallbackError) {
      console.error("Even fallback query failed:", fallbackError);
      // Return empty array as final fallback
      return [];
    }
  }
};

// Helper function to check if the Supabase connection is working
export const checkSupabaseConnection = async () => {
  try {
    const start = Date.now();
    const { data, error } = await supabase.from('entries').select('count').limit(1);
    const elapsed = Date.now() - start;
    
    return {
      connected: !error,
      responseTime: elapsed,
      error: error?.message
    };
  } catch (e) {
    console.error("Supabase connection check failed:", e);
    return {
      connected: false,
      responseTime: 0,
      error: e instanceof Error ? e.message : 'Unknown error'
    };
  }
};
