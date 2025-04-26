import { supabase } from "@/integrations/supabase/client";
import { ReadingHistoryItem } from "@/types/readingHistory";

/**
 * Get reading history for a user
 */
export const getUserReadingHistory = async (userId: string): Promise<ReadingHistoryItem[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error(`[${new Date().toISOString()}] readingHistoryService: No active session`);
      return [];
    }

    // Ensure user matches the session user
    if (session.user.id !== userId) {
      console.error(`[${new Date().toISOString()}] readingHistoryService: User ID mismatch. Requested: ${userId}, Session: ${session.user.id}`);
      return [];
    }

    console.log(`[${new Date().toISOString()}] readingHistoryService: Fetching reading history for user ${userId} with valid session`);
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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error(`[${new Date().toISOString()}] readingHistoryService: No active session when checking read status`);
      return false;
    }

    // Ensure user matches the session user
    if (session.user.id !== userId) {
      console.error(`[${new Date().toISOString()}] readingHistoryService: User ID mismatch when checking read status`);
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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error(`[${new Date().toISOString()}] readingHistoryService: No active session when trying to toggle read status`);
      return false;
    }

    // Check if the session contains a valid access token
    if (!session.access_token) {
      console.error(`[${new Date().toISOString()}] readingHistoryService: No access token in session`);
      // Try refreshing the session
      const { data: refreshData } = await supabase.auth.refreshSession();
      if (!refreshData.session) {
        console.error(`[${new Date().toISOString()}] readingHistoryService: Failed to refresh session`);
        return false;
      }
      console.log(`[${new Date().toISOString()}] readingHistoryService: Session refreshed successfully`);
    }

    // Verify the session user matches the requested userId
    if (session.user.id !== userId) {
      console.error(`[${new Date().toISOString()}] readingHistoryService: Session user ID (${session.user.id}) does not match requested user ID (${userId})`);
      return false;
    }

    console.log(`[${new Date().toISOString()}] readingHistoryService: togglePostReadStatus called with userId=${userId}, postId=${postId}, isRead=${isRead}, session auth status: valid`);
    
    if (isRead) {
      const payload = {
        user_id: userId,
        post_id: postId,
        read_at: new Date().toISOString()
      };

      // Use upsert instead of insert to handle existing records
      const { error } = await supabase
        .from('reading_history')
        .upsert(payload, {
          onConflict: 'user_id,post_id',
          ignoreDuplicates: false // We want to update the read_at timestamp
        });

      if (error) {
        console.error(`[${new Date().toISOString()}] readingHistoryService: Error upserting read status:`, error);
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
  } catch (error: any) {
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
