
import { supabase } from "../../integrations/supabase/client";

// Mark a post as read for a user
export const markPostAsRead = async (userId: string, postId: string): Promise<void> => {
  console.log(`Marking post ${postId} as read for user ${userId}`);
  
  try {
    const { data, error } = await supabase
      .from('reading_history')
      .upsert(
        { user_id: userId, post_id: postId },
        { onConflict: 'user_id,post_id' }
      );
      
    if (error) {
      console.error("Error marking post as read:", error);
      throw error;
    }
    
    console.log(`Post ${postId} marked as read successfully`);
  } catch (error) {
    console.error("Error in markPostAsRead:", error);
    throw error;
  }
};

// Check if a post has been read by a user
export const hasReadPost = async (userId: string, postId: string): Promise<boolean> => {
  console.log(`Checking if user ${userId} has read post ${postId}`);
  
  try {
    const { data, error } = await supabase
      .from('reading_history')
      .select('*')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle();
      
    if (error) {
      console.error("Error checking if post was read:", error);
      return false; // Assume not read in case of error
    }
    
    const hasRead = !!data;
    console.log(`User ${userId} has ${hasRead ? '' : 'not '}read post ${postId}`);
    return hasRead;
  } catch (error) {
    console.error("Error in hasReadPost:", error);
    return false; // Assume not read in case of error
  }
};
