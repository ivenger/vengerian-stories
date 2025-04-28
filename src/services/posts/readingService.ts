
import { supabase } from "@/integrations/supabase/client";

export const markPostAsRead = async (userId: string, postId: string): Promise<void> => {
  console.log(`Marking post ${postId} as read for user ${userId}`);
  
  try {
    const { data: existingRecord, error: checkError } = await supabase
      .from('reading_history')
      .select('user_id, post_id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle();
      
    if (checkError) {
      if (checkError.code === '406') {
        console.warn("406 Not Acceptable error when checking read status - skipping operation");
        return;
      }
      throw checkError;
    }
    
    if (existingRecord) {
      console.log(`Post ${postId} already marked as read`);
      return;
    }
    
    const { error: insertError } = await supabase
      .from('reading_history')
      .insert({ 
        user_id: userId, 
        post_id: postId,
        read_at: new Date().toISOString()
      });
      
    if (insertError) {
      if (insertError.code === '406') {
        console.warn("406 Not Acceptable error when marking post as read - skipping operation");
        return;
      }
      throw insertError;
    }
    
    console.log(`Post ${postId} marked as read successfully`);
  } catch (error: any) {
    console.error("Error in markPostAsRead:", error);
    console.warn(`Failed to mark post as read: ${error.message}`);
  }
};

export const hasReadPost = async (userId: string, postId: string): Promise<boolean> => {
  console.log(`Checking if user ${userId} has read post ${postId}`);
  
  try {
    const { data, error } = await supabase
      .from('reading_history')
      .select('user_id, post_id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle();
      
    if (error) {
      console.error("Error checking if post was read:", error);
      return false;
    }
    
    const hasRead = !!data;
    console.log(`User ${userId} has ${hasRead ? '' : 'not '}read post ${postId}`);
    return hasRead;
  } catch (error: any) {
    console.error("Error in hasReadPost:", error);
    return false;
  }
};
