
import { supabase } from "@/integrations/supabase/client";
import { ReadingHistoryItem } from "@/types/readingHistory";

/**
 * Get reading history for a user
 */
export const getUserReadingHistory = async (userId: string): Promise<ReadingHistoryItem[]> => {
  try {
    const { data, error } = await supabase
      .from('reading_history')
      .select('*')
      .eq('user_id', userId)
      .order('read_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching reading history:', error);
      throw new Error(`Failed to fetch reading history: ${error.message}`);
    }
    
    return data || [];
  } catch (error: any) {
    console.error('Failed to fetch reading history:', error);
    throw new Error(`Failed to fetch reading history: ${error.message}`);
  }
};

/**
 * Check if a post has been read by a user
 */
export const isPostRead = async (userId: string, postId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('reading_history')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle();
      
    if (error) {
      console.error('Error checking if post is read:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error checking if post is read:', error);
    return false;
  }
};

/**
 * Mark or unmark a post as read
 */
export const togglePostReadStatus = async (userId: string, postId: string, isRead: boolean): Promise<boolean> => {
  try {
    if (isRead) {
      // Mark as read
      const { error } = await supabase
        .from('reading_history')
        .upsert({
          user_id: userId,
          post_id: postId,
          read_at: new Date().toISOString()
        });
        
      if (error) {
        console.error('Error marking post as read:', error);
        return false;
      }
      
      return true;
    } else {
      // Mark as unread (delete the record)
      const { error } = await supabase
        .from('reading_history')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId);
        
      if (error) {
        console.error('Error marking post as unread:', error);
        return false;
      }
      
      return true;
    }
  } catch (error) {
    console.error('Error toggling post read status:', error);
    return false;
  }
};

/**
 * Update the blogService.ts to include the reading history service
 */
export const markPostAsRead = async (userId: string, postId: string): Promise<void> => {
  await togglePostReadStatus(userId, postId, true);
};
