
import { supabase } from "@/integrations/supabase/client";
import { ReadingHistoryItem } from "@/types/readingHistory";

/**
 * Get reading history for a user
 */
export const getUserReadingHistory = async (userId: string): Promise<ReadingHistoryItem[]> => {
  try {
    console.log(`[${new Date().toISOString()}] readingHistoryService: Fetching reading history for user ${userId}`);
    const { data, error } = await supabase
      .from('reading_history')
      .select('*')
      .eq('user_id', userId)
      .order('read_at', { ascending: false });
      
    if (error) {
      console.error(`[${new Date().toISOString()}] readingHistoryService: Error fetching reading history:`, error);
      throw new Error(`Failed to fetch reading history: ${error.message}`);
    }
    
    console.log(`[${new Date().toISOString()}] readingHistoryService: Retrieved ${data?.length || 0} reading history items`);
    return data || [];
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] readingHistoryService: Failed to fetch reading history:`, error);
    throw new Error(`Failed to fetch reading history: ${error.message}`);
  }
};

/**
 * Check if a post has been read by a user
 */
export const isPostRead = async (userId: string, postId: string): Promise<boolean> => {
  try {
    console.log(`[${new Date().toISOString()}] readingHistoryService: Checking if user ${userId} has read post ${postId}`);
    const { data, error } = await supabase
      .from('reading_history')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle();
      
    if (error) {
      console.error(`[${new Date().toISOString()}] readingHistoryService: Error checking read status:`, error);
      return false;
    }
    
    const result = !!data;
    console.log(`[${new Date().toISOString()}] readingHistoryService: User has ${result ? '' : 'not '}read post ${postId}`);
    return result;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] readingHistoryService: Error checking if post is read:`, error);
    return false;
  }
};

/**
 * Mark or unmark a post as read
 */
export const togglePostReadStatus = async (userId: string, postId: string, isRead: boolean): Promise<boolean> => {
  try {
    console.log(`[${new Date().toISOString()}] readingHistoryService: Setting read status for post ${postId} to ${isRead}`);
    
    if (isRead) {
      // Mark as read
      const { error, data } = await supabase
        .from('reading_history')
        .upsert({
          user_id: userId,
          post_id: postId,
          read_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,post_id'
        });
        
      if (error) {
        console.error(`[${new Date().toISOString()}] readingHistoryService: Error marking post as read:`, error);
        return false;
      }
      
      console.log(`[${new Date().toISOString()}] readingHistoryService: Successfully marked post ${postId} as read`, data);
      return true;
    } else {
      // Mark as unread (delete the record)
      const { error, data } = await supabase
        .from('reading_history')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId);
        
      if (error) {
        console.error(`[${new Date().toISOString()}] readingHistoryService: Error marking post as unread:`, error);
        return false;
      }
      
      console.log(`[${new Date().toISOString()}] readingHistoryService: Successfully marked post ${postId} as unread`, data);
      return true;
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] readingHistoryService: Error toggling post read status:`, error);
    return false;
  }
};

/**
 * Convenient function to mark a post as read
 */
export const markPostAsRead = async (userId: string, postId: string): Promise<void> => {
  const success = await togglePostReadStatus(userId, postId, true);
  console.log(`[${new Date().toISOString()}] readingHistoryService: Mark post ${postId} as read result:`, success);
};
