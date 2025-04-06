import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';

export const useReadingTracker = (postId: string | undefined, user: User | null) => {
  const [isRead, setIsRead] = useState(false);

  // Check if post is already marked as read
  useEffect(() => {
    let isMounted = true;

    const checkReadStatus = async () => {
      if (!user || !postId) {
        console.log("ReadingTracker: Not checking read status because user or postId is missing");
        return;
      }

      console.log(`ReadingTracker: Checking read status for user ${user.id} and post ${postId}`);
      try {
        const { data, error } = await supabase
          .from('reading_history')
          .select('user_id, post_id') // Specify columns explicitly
          .eq('user_id', user.id)
          .eq('post_id', postId)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows returned"
          console.error("ReadingTracker: Error checking read status:", error);
        } else if (isMounted) {
          console.log(`ReadingTracker: Read status is ${!!data}`);
          setIsRead(!!data);
        }
      } catch (readErr) {
        console.error("ReadingTracker: Error checking read status:", readErr);
      }
    };

    checkReadStatus();

    return () => {
      isMounted = false;
    };
  }, [postId, user]);

  // Mark post as read when it loads
  useEffect(() => {
    let isMounted = true;

    const markAsRead = async () => {
      if (!user || !postId || isRead) {
        console.log("ReadingTracker: Not marking as read because:", 
          !user ? "no user" : !postId ? "no postId" : "already read");
        return;
      }

      try {
        console.log(`ReadingTracker: Marking post ${postId} as read for user ${user.id}`);
        // Insert into reading history
        const { error } = await supabase
          .from('reading_history')
          .upsert({ 
            user_id: user.id, 
            post_id: postId,
            read_at: new Date().toISOString()
          }, { 
            onConflict: 'user_id,post_id' 
          });

        if (error) {
          console.error("ReadingTracker: Error marking post as read:", error);
          return;
        }

        if (isMounted) {
          console.log("ReadingTracker: Successfully marked post as read");
          setIsRead(true);
        }
      } catch (err) {
        console.error("ReadingTracker: Error in markAsRead:", err);
      }
    };

    // Only try to mark as read if we have all required data
    markAsRead();

    return () => {
      isMounted = false;
    };
  }, [postId, user, isRead]);

  return { isRead };
};
