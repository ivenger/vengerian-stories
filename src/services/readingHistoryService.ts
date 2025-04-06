
import { supabase } from '../integrations/supabase/client';
import { ReadingHistoryItem } from '../types/readingHistory';

/**
 * Check if a user has read a specific post
 * @param userId - The ID of the user
 * @param postId - The ID of the post to check
 * @returns True if the user has read the post, false otherwise
 */
export const hasUserReadPost = async (userId: string, postId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('reading_history')
      .select('id')
      .eq('user_id', userId as any)
      .eq('post_id', postId as any)
      .single();
      
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking reading history:', error);
    }
    
    return !!data;
  } catch (error) {
    console.error('Error checking if post was read:', error);
    return false;
  }
};

/**
 * Mark a post as read by a user
 * @param userId - The ID of the user
 * @param postId - The ID of the post to mark as read
 */
export const markPostAsRead = async (userId: string, postId: string): Promise<void> => {
  try {
    // Check if a reading history record already exists
    const existing = await hasUserReadPost(userId, postId);
    if (existing) {
      console.log(`Post ${postId} already marked as read by user ${userId}`);
      return;
    }
    
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('reading_history')
      .insert({
        user_id: userId as any,
        post_id: postId as any,
        read_at: now as any
      } as any);
      
    if (error) {
      throw error;
    }
    
    console.log(`Post ${postId} marked as read by user ${userId}`);
  } catch (error) {
    console.error('Error marking post as read:', error);
    throw error;
  }
};

/**
 * Get all posts that a user has read
 * @param userId - The ID of the user
 * @returns An array of reading history items
 */
export const getUserReadingHistory = async (userId: string): Promise<ReadingHistoryItem[]> => {
  try {
    const { data, error } = await supabase
      .from('reading_history')
      .select('*')
      .eq('user_id', userId as any)
      .order('read_at', { ascending: false });
      
    if (error) {
      throw error;
    }
    
    // Convert the data to ReadingHistoryItem type
    const readingHistory: ReadingHistoryItem[] = data.map(item => ({
      id: item.id,
      user_id: item.user_id,
      post_id: item.post_id,
      read_at: item.read_at
    }));
    
    return readingHistory;
  } catch (error) {
    console.error('Error retrieving reading history:', error);
    return [];
  }
};

/**
 * Get the IDs of all posts read by a user
 * @param userId - The ID of the user
 * @returns An array of post IDs
 */
export const getUserReadPostIds = async (userId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('reading_history')
      .select('post_id')
      .eq('user_id', userId as any);
      
    if (error) {
      throw error;
    }
    
    return data.map(item => item.post_id);
  } catch (error) {
    console.error('Error retrieving read post IDs:', error);
    return [];
  }
};

// Export all functions
export default {
  hasUserReadPost,
  markPostAsRead,
  getUserReadingHistory,
  getUserReadPostIds
};
