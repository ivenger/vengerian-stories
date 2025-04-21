
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { togglePostReadStatus } from "@/services/readingHistoryService";
import { useToast } from "@/hooks/use-toast";

export const useReadingTracker = (postId: string | undefined, user: User | null) => {
  const [isRead, setIsRead] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

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
        setIsUpdating(true);
        
        // Try to get read status from API
        try {
          const readStatus = await fetch(`/api/reading-status?userId=${user.id}&postId=${postId}`);
          
          if (readStatus.ok) {
            const result = await readStatus.json();
            if (isMounted) {
              console.log(`ReadingTracker: Read status from API is ${!!result.isRead}`);
              setIsRead(!!result.isRead);
            }
            setIsUpdating(false);
            return;
          }
        } catch (apiError) {
          console.log("ReadingTracker: API error, falling back to direct database check", apiError);
          // Continue to fallback implementation
        }
        
        // Fallback to local implementation
        const { data, error } = await import('@/integrations/supabase/client').then(({ supabase }) =>
          supabase
            .from('reading_history')
            .select('id')
            .eq('user_id', user.id)
            .eq('post_id', postId)
            .maybeSingle()
        );

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
      } finally {
        if (isMounted) {
          setIsUpdating(false);
        }
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
        
        // Use the togglePostReadStatus function to mark as read
        const success = await togglePostReadStatus(user.id, postId, true);

        if (!success) {
          console.error("ReadingTracker: Error marking post as read");
          return;
        }

        if (isMounted) {
          console.log("ReadingTracker: Successfully marked post as read");
          setIsRead(true);
          toast({
            title: "Post marked as read",
            description: "This post has been added to your reading history",
          });
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
  }, [postId, user, isRead, isUpdating, toast]);

  const toggleReadStatus = async () => {
    if (!user || !postId || isUpdating) return;
    
    try {
      setIsUpdating(true);
      
      // Use the togglePostReadStatus function from the service
      const success = await togglePostReadStatus(user.id, postId, !isRead);
      
      if (!success) {
        console.error("ReadingTracker: Error toggling read status");
        toast({
          title: "Error",
          description: "Failed to update reading status",
          variant: "destructive",
        });
        return;
      }
      
      setIsRead(!isRead);
      toast({
        title: isRead ? "Marked as unread" : "Marked as read",
        description: isRead 
          ? "This post has been removed from your reading history" 
          : "This post has been added to your reading history",
      });
    } catch (err) {
      console.error("ReadingTracker: Error in toggleReadStatus:", err);
      toast({
        title: "Error",
        description: "Failed to update reading status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return { isRead, isUpdating, toggleReadStatus };
};
