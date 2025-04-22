
import { supabase } from "@/integrations/supabase/client";
import { ReadingHistoryItem } from "@/types/readingHistory";

/**
 * Get reading history for a user
 */
export const getUserReadingHistory = async (userId: string): Promise<ReadingHistoryItem[]> => {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      console.error(`[${new Date().toISOString()}] readingHistoryService: No active session`);
      return [];
    }

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
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      console.error(`[${new Date().toISOString()}] readingHistoryService: No active session`);
      return false;
    }

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
    // First verify we have an active session
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      console.error(`[${new Date().toISOString()}] readingHistoryService: No active session when trying to toggle read status`);
      return false;
    }

    // Verify the session user matches the requested userId
    if (session.data.session.user.id !== userId) {
      console.error(`[${new Date().toISOString()}] readingHistoryService: Session user ID does not match requested user ID`);
      return false;
    }

    console.log(`[${new Date().toISOString()}] readingHistoryService: togglePostReadStatus called with userId=${userId}, postId=${postId}, isRead=${isRead}`);
    
    if (isRead) {
      const payload = {
        user_id: userId,
        post_id: postId,
        read_at: new Date().toISOString()
      };

      // Insert new record - if it fails due to duplicate, we'll update
      const { error: insertError } = await supabase
        .from('reading_history')
        .insert(payload);

      if (insertError && insertError.code === '23505') { // Unique violation
        // Update existing record
        console.log(`[${new Date().toISOString()}] readingHistoryService: Updating existing reading_history record`);
        const { error: updateError } = await supabase
          .from('reading_history')
          .update({ read_at: payload.read_at })
          .eq('user_id', userId)
          .eq('post_id', postId);

        if (updateError) {
          console.error(`[${new Date().toISOString()}] readingHistoryService: Error updating read status:`, updateError);
          return false;
        }
      } else if (insertError) {
        console.error(`[${new Date().toISOString()}] readingHistoryService: Error inserting read status:`, insertError);
        return false;
      }

      console.log(`[${new Date().toISOString()}] readingHistoryService: Successfully marked post ${postId} as read`);
      return true;
    } else {
      // Mark as unread (delete the record)
      console.log(`[${new Date().toISOString()}] readingHistoryService: Deleting from reading_history where user_id=${userId} and post_id=${postId}`);
      const { error } = await supabase
        .from('reading_history')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId);

      if (error) {
        console.error(`[${new Date().toISOString()}] readingHistoryService: Error marking post as unread:`, error);
        return false;
      }
      
      console.log(`[${new Date().toISOString()}] readingHistoryService: Successfully marked post ${postId} as unread`);
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
