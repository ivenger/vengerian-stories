import { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { togglePostReadStatus, isPostRead } from "@/services/readingHistoryService";
import { useToast } from "@/hooks/use-toast";

export const useReadingTracker = (postId: string | undefined, user: User | null) => {
  const [isRead, setIsRead] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const isMounted = useRef(true);
  const hasCheckedStatus = useRef(false);
  const statusCheckInProgress = useRef(false);
  const markAsReadInProgress = useRef(false);
  const { toast } = useToast();

  // Keep track of mounted state
  useEffect(() => {
    console.log(`[${new Date().toISOString()}] ReadingTracker: Component mounted`);
    isMounted.current = true;
    
    return () => {
      console.log(`[${new Date().toISOString()}] ReadingTracker: Component unmounted`);
      isMounted.current = false;
    };
  }, []);

  // Check if post is already marked as read
  useEffect(() => {
    // Reset state when user or postId changes
    setIsRead(false);
    hasCheckedStatus.current = false;
    statusCheckInProgress.current = false;
    markAsReadInProgress.current = false;
    
    const checkReadStatus = async () => {
      if (!user || !postId || statusCheckInProgress.current) {
        console.log(`[${new Date().toISOString()}] ReadingTracker: Not checking read status because:`, { 
          hasUser: !!user, 
          postId, 
          statusCheckInProgress: statusCheckInProgress.current 
        });
        return;
      }

      // Set flag to prevent concurrent status checks
      statusCheckInProgress.current = true;
      
      console.log(`[${new Date().toISOString()}] ReadingTracker: Checking read status for user ${user.id} and post ${postId}`);
      try {
        if (!isMounted.current) return;
        
        setIsUpdating(true);
        
        // Try to get read status from direct database check
        const readStatus = await isPostRead(user.id, postId);
        
        if (!isMounted.current) return;
        
        console.log(`[${new Date().toISOString()}] ReadingTracker: Read status is ${readStatus}`);
        setIsRead(readStatus);
        hasCheckedStatus.current = true;
      } catch (readErr) {
        console.error(`[${new Date().toISOString()}] ReadingTracker: Error checking read status:`, readErr);
      } finally {
        statusCheckInProgress.current = false;
        if (isMounted.current) {
          setIsUpdating(false);
        }
      }
    };

    checkReadStatus();
  }, [postId, user]);

  // Mark post as read when viewing it (if not already read)
  useEffect(() => {
    if (!user || !postId || isRead || isUpdating || !hasCheckedStatus.current || markAsReadInProgress.current) {
      console.log(`[${new Date().toISOString()}] ReadingTracker: Not auto-marking as read because:`, {
        hasUser: !!user,
        hasPostId: !!postId,
        isAlreadyRead: isRead,
        isUpdateInProgress: isUpdating,
        hasCheckedStatus: hasCheckedStatus.current,
        markAsReadInProgress: markAsReadInProgress.current
      });
      return;
    }

    const markAsRead = async () => {
      // Set flag to prevent concurrent mark as read operations
      markAsReadInProgress.current = true;
      
      try {
        if (!isMounted.current) return;
        
        setIsUpdating(true);
        
        console.log(`[${new Date().toISOString()}] ReadingTracker: Auto-marking post ${postId} as read for user ${user.id}`);
        const success = await togglePostReadStatus(user.id, postId, true);

        if (!success) {
          console.error(`[${new Date().toISOString()}] ReadingTracker: Error marking post as read`);
          return;
        }

        if (isMounted.current) {
          console.log(`[${new Date().toISOString()}] ReadingTracker: Successfully marked post as read`);
          setIsRead(true);
          toast({
            title: "Post marked as read",
            description: "This post has been added to your reading history",
          });
        }
      } catch (err) {
        console.error(`[${new Date().toISOString()}] ReadingTracker: Error in markAsRead:`, err);
      } finally {
        markAsReadInProgress.current = false;
        if (isMounted.current) {
          setIsUpdating(false);
        }
      }
    };

    // Only mark as read if we've confirmed status and it's not already read
    markAsRead();
  }, [postId, user, isRead, isUpdating, toast]);

  // Manual toggle function
  const toggleReadStatus = async () => {
    if (!user || !postId || isUpdating || markAsReadInProgress.current) {
      console.log(`[${new Date().toISOString()}] ReadingTracker: Cannot toggle read status`, {
        hasUser: !!user,
        hasPostId: !!postId,
        isUpdateInProgress: isUpdating,
        markAsReadInProgress: markAsReadInProgress.current
      });
      return;
    }
    
    try {
      markAsReadInProgress.current = true;
      setIsUpdating(true);
      
      console.log(`[${new Date().toISOString()}] ReadingTracker: Manually toggling read status to ${!isRead}`);
      
      // Update local state first for immediate feedback
      const newIsRead = !isRead;
      setIsRead(newIsRead);
      
      // Use the togglePostReadStatus function from the service
      const success = await togglePostReadStatus(user.id, postId, newIsRead);
      
      if (!success) {
        // Revert the local state if request failed
        console.error(`[${new Date().toISOString()}] ReadingTracker: Error toggling read status`);
        setIsRead(isRead); // Revert to previous state
        toast({
          title: "Error",
          description: "Failed to update reading status",
          variant: "destructive",
        });
        return;
      }
      
      console.log(`[${new Date().toISOString()}] ReadingTracker: Successfully toggled read status to ${newIsRead}`);
      
      toast({
        title: newIsRead ? "Marked as read" : "Marked as unread",
        description: newIsRead 
          ? "This post has been added to your reading history" 
          : "This post has been removed from your reading history",
      });
    } catch (err) {
      // Revert local state on error
      setIsRead(isRead);
      console.error(`[${new Date().toISOString()}] ReadingTracker: Error in toggleReadStatus:`, err);
      toast({
        title: "Error",
        description: "Failed to update reading status",
        variant: "destructive",
      });
    } finally {
      markAsReadInProgress.current = false;
      setIsUpdating(false);
    }
  };

  return { 
    isRead, 
    isUpdating, 
    toggleReadStatus 
  };
};
