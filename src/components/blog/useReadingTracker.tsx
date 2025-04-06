
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import { readingHistoryService } from '@/services/blogService';

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
        // Use the service function instead of direct query
        const hasRead = await readingHistoryService.hasReadPost(postId, user.id);
        
        if (isMounted) {
          console.log(`ReadingTracker: Read status is ${hasRead}`);
          setIsRead(hasRead);
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
        
        // Use the service function instead of direct insert
        const success = await readingHistoryService.markPostAsRead(postId, user.id);

        if (isMounted && success) {
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
