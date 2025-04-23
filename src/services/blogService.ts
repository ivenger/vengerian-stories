
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
import { BlogEntry } from '@/types/blogTypes';

/**
 * Fallback function to fetch posts with better error handling and timeout protection
 * This function will catch errors from fetchFilteredPosts and provide fallbacks
 */
export const fetchPostsWithFallback = async (tags?: string[]): Promise<BlogEntry[]> => {
  console.log("fetchPostsWithFallback called with tags:", tags);
  
  try {
    // Create a timeout promise to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Fetch timeout exceeded')), 8000);
    });
    
    // Race between the actual fetch and the timeout
    const posts = await Promise.race<BlogEntry[]>([
      fetchFilteredPosts(tags),
      timeoutPromise
    ]);
    
    if (Array.isArray(posts)) {
      console.log(`Successfully fetched ${posts.length} posts`);
      return posts;
    } else {
      console.error("Invalid posts data", posts);
      return [];
    }
  } catch (error) {
    console.error("Error in fetchPostsWithFallback:", error);
    
    // Try direct Supabase query as last resort
    try {
      console.log("Attempting direct Supabase query as fallback");
      
      // Ensure we have a valid session first
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.log("No valid session for direct query");
        return [];
      }
      
      let query = supabase
        .from('entries')
        .select('*')
        .order('date', { ascending: false });
      
      if (tags && tags.length > 0) {
        console.log("Adding tags filter to query:", tags);
        query = query.contains('tags', tags);
      } else {
        console.log("No tags filter applied");
        query = query.eq('status', 'published');
      }
      
      // Set a shorter timeout for this query
      const { data, error } = await query.abortSignal(AbortSignal.timeout(5000));
      
      if (error) {
        console.error("Fallback query error:", error);
        throw error;
      }
      
      if (Array.isArray(data)) {
        console.log(`Fallback query returned ${data.length || 0} posts`);
        return data as BlogEntry[];
      } else {
        console.error("Invalid data returned from fallback query", data);
        return [];
      }
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
