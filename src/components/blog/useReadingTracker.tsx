
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';

export const useReadingTracker = (postId: string | undefined, user: User | null) => {
  const [isRead, setIsRead] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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
          .select('id, user_id, post_id, read_at')
          .eq('user_id', user.id)
          .eq('post_id', postId)
          .maybeSingle();

        if (error) {
          console.error("useReadingTracker: Error checking read status:", error);
          return;
        }

        if (isMounted) {
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
      if (!user || !postId || isRead || isUpdating) {
        console.log("ReadingTracker: Not marking as read because:", 
          !user ? "no user" : !postId ? "no postId" : isRead ? "already read" : "update in progress");
        return;
      }

      try {
        setIsUpdating(true);
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
          if (error.code === '406') {
            console.warn("ReadingTracker: 406 Not Acceptable error when marking as read - skipping");
            return;
          }
          console.error("ReadingTracker: Error marking post as read:", error);
          return;
        }

        if (isMounted) {
          console.log("ReadingTracker: Successfully marked post as read");
          setIsRead(true);
        }
      } catch (err) {
        console.error("ReadingTracker: Error in markAsRead:", err);
      } finally {
        if (isMounted) {
          setIsUpdating(false);
        }
      }
    };

    // Only try to mark as read if we have all required data
    markAsRead();

    return () => {
      isMounted = false;
    };
  }, [postId, user, isRead, isUpdating]);

  const toggleReadStatus = async () => {
    if (!user || !postId || isUpdating) return;
    
    try {
      setIsUpdating(true);
      
      if (isRead) {
        // Remove from reading history
        console.log(`ReadingTracker: Removing read status for post ${postId}`);
        const { error } = await supabase
          .from('reading_history')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
          
        if (error) {
          console.error("ReadingTracker: Error removing read status:", error);
          return;
        }
        
        setIsRead(false);
      } else {
        // Mark as read
        console.log(`ReadingTracker: Manually marking post ${postId} as read`);
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
        
        setIsRead(true);
      }
    } catch (err) {
      console.error("ReadingTracker: Error in toggleReadStatus:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  return { isRead, isUpdating, toggleReadStatus };
};
