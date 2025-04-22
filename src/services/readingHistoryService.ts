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
    // Enhanced logging: check current session and token
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const session = sessionData?.session;
    const accessToken = session?.access_token || null;
    const sessionUserId = session?.user?.id || null;
    console.log(`[${new Date().toISOString()}] [DEBUG] togglePostReadStatus: userId arg =`, userId, 
      '| sessionUserId =', sessionUserId, '| accessToken exists =', !!accessToken, '\nSession:', session);
    if (sessionError) {
      console.error(`[${new Date().toISOString()}] [DEBUG] togglePostReadStatus: session error:`, sessionError);
    }
    if (!session) {
      console.warn(`[${new Date().toISOString()}] [DEBUG] togglePostReadStatus: No active session!`);
    } else if (userId !== sessionUserId) {
      console.warn(`[${new Date().toISOString()}] [DEBUG] togglePostReadStatus: userId does not match session user id!`);
    }

    console.log(`[${new Date().toISOString()}] readingHistoryService: togglePostReadStatus called with userId=${userId}, postId=${postId}, isRead=${isRead}`);
    if (isRead) {
      // Mark as read
      const upsertPayload = {
        user_id: userId,
        post_id: postId,
        read_at: new Date().toISOString()
      };
      console.log(`[${new Date().toISOString()}] readingHistoryService: Upserting into reading_history:`, upsertPayload);
      const { error, data, status, statusText } = await supabase
        .from('reading_history')
        .upsert(upsertPayload, {
          onConflict: 'user_id,post_id'
        });
      console.log(`[${new Date().toISOString()}] [DEBUG] Upsert response:`, { error, data, status, statusText });
      if (error) {
        console.error(`[${new Date().toISOString()}] readingHistoryService: Error marking post as read:`, error, '\nPayload:', upsertPayload, '\nSession:', session);
        return false;
      }
      console.log(`[${new Date().toISOString()}] readingHistoryService: Successfully marked post ${postId} as read. Returned data:`, data);
      return true;
    } else {
      // Mark as unread (delete the record)
      console.log(`[${new Date().toISOString()}] readingHistoryService: Deleting from reading_history where user_id=${userId} and post_id=${postId}`);
      const { error, data, status, statusText } = await supabase
        .from('reading_history')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId);
      console.log(`[${new Date().toISOString()}] [DEBUG] Delete response:`, { error, data, status, statusText });
      if (error) {
        console.error(`[${new Date().toISOString()}] readingHistoryService: Error marking post as unread:`, error, '\nSession:', session);
        return false;
      }
      console.log(`[${new Date().toISOString()}] readingHistoryService: Successfully marked post ${postId} as unread. Returned data:`, data);
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
