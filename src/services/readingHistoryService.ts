
import { supabase } from '@/integrations/supabase/client';

/**
 * Checks if a post has been read by the current user
 * Handles 406 Not Acceptable errors gracefully
 */
export const hasReadPost = async (postId: string, userId: string): Promise<boolean> => {
  try {
    // Use maybeSingle instead of single to avoid errors when no record is found
    const { data, error } = await supabase
      .from('reading_history')
      .select('*')
      .eq('user_id', userId as any)
      .eq('post_id', postId as any)
      .maybeSingle();
      
    if (error) {
      // Handle 406 errors specifically - these are non-critical
      if (error.code === '406') {
        console.warn("hasReadPost: 406 Not Acceptable error - continuing with false result");
        return false;
      }
      
      console.error("Error checking post read status:", error);
      return false;
    }
    
    return !!data;
  } catch (err) {
    console.error("Exception checking post read status:", err);
    return false;
  }
};

/**
 * Marks a post as read by the current user
 * Handles 406 Not Acceptable errors gracefully
 */
export const markPostAsRead = async (postId: string, userId: string): Promise<boolean> => {
  try {
    // First check if it's already marked as read to avoid duplicates
    const alreadyRead = await hasReadPost(postId, userId);
    
    if (alreadyRead) {
      console.log("Post already marked as read");
      return true;
    }
    
    // If not already read, insert a new reading history record
    const { error } = await supabase
      .from('reading_history')
      .insert({
        user_id: userId as any,
        post_id: postId as any,
        read_at: new Date().toISOString()
      } as any);
      
    if (error) {
      console.error("Error marking post as read:", error);
      return false;
    }
    
    console.log("Successfully marked post as read");
    return true;
  } catch (err) {
    console.error("Exception marking post as read:", err);
    return false;
  }
};

/**
 * Gets all read post IDs for a user
 */
export const getReadPostIds = async (userId: string): Promise<string[]> => {
  try {
    if (!userId) return [];
    
    const { data, error } = await supabase
      .from('reading_history')
      .select('post_id')
      .eq('user_id', userId as any);
      
    if (error) {
      // Handle 406 errors specifically - these are non-critical
      if (error.code === '406') {
        console.warn("getReadPostIds: 406 Not Acceptable error - returning empty array");
        return [];
      }
      
      console.error("Error fetching reading history:", error);
      return [];
    }
    
    // Safely extract post_id values
    const postIds = (data || []).map(item => {
      // Type guard to avoid TypeScript errors with post_id access
      if (item && typeof item === 'object' && 'post_id' in item) {
        return item.post_id as string;
      }
      return '';
    }).filter(id => id !== '');
    
    return postIds;
  } catch (err) {
    console.error("Exception fetching reading history:", err);
    return [];
  }
};
