
import { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { togglePostReadStatus, isPostRead } from "@/services/readingHistoryService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useReadingTracker = (postId: string | undefined, user: User | null) => {
  const [isRead, setIsRead] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const isMounted = useRef(true);
  const hasCheckedStatus = useRef(false);
  const { toast } = useToast();
  // Add a retry counter to prevent infinite loops
  const retryCount = useRef(0);
  const MAX_RETRIES = 3;

  // Track page URL for better debugging
  useEffect(() => {
    console.log(`[${new Date().toISOString()}] ReadingTracker: Initialized on page ${window.location.pathname} with postId=${postId}, user=${user?.id}`);
  }, []);

  // Keep track of mounted state
  useEffect(() => {
    isMounted.current = true;
    return () => {
      console.log(`[${new Date().toISOString()}] ReadingTracker: Component unmounting`);
      isMounted.current = false;
    };
  }, []);

  // Reset auth state if needed
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user) {
        // Check if we need to refresh the session when page becomes visible
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log(`[${new Date().toISOString()}] ReadingTracker: No active session detected, attempting refresh`);
          await supabase.auth.refreshSession();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  // Check if post is already marked as read
  useEffect(() => {
    // Reset state when user or postId changes
    setIsRead(false);
    hasCheckedStatus.current = false;
    retryCount.current = 0;
    
    const checkReadStatus = async () => {
      if (!user || !postId) {
        console.log(`[${new Date().toISOString()}] ReadingTracker: Not checking read status because user or postId is missing`, 
          { hasUser: !!user, postId });
        return;
      }

      console.log(`[${new Date().toISOString()}] ReadingTracker: Checking read status for user ${user.id} and post ${postId}`);
      try {
        if (!isMounted.current) return;
        setIsUpdating(true);
        
        // Verify session before checking read status
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.warn(`[${new Date().toISOString()}] ReadingTracker: No active session, attempting refresh`);
          const { data } = await supabase.auth.refreshSession();
          if (!data.session) {
            console.error(`[${new Date().toISOString()}] ReadingTracker: Failed to refresh session`);
            if (isMounted.current) {
              setIsUpdating(false);
            }
            return;
          }
        }
        
        // Try to get read status from direct database check
        const readStatus = await isPostRead(user.id, postId);
        
        if (!isMounted.current) return;
        console.log(`[${new Date().toISOString()}] ReadingTracker: Read status is ${readStatus}`);
        setIsRead(readStatus);
        hasCheckedStatus.current = true;
      } catch (readErr) {
        console.error(`[${new Date().toISOString()}] ReadingTracker: Error checking read status:`, readErr);
      } finally {
        if (isMounted.current) {
          setIsUpdating(false);
        }
      }
    };

    checkReadStatus();
  }, [postId, user]);

  // Mark post as read when viewing it (if not already read)
  useEffect(() => {
    if (!user || !postId || isRead || isUpdating || !hasCheckedStatus.current) {
      console.log(`[${new Date().toISOString()}] ReadingTracker: Not auto-marking as read because:`, {
        hasUser: !!user,
        hasPostId: !!postId,
        isAlreadyRead: isRead,
        isUpdateInProgress: isUpdating,
        hasCheckedStatus: hasCheckedStatus.current
      });
      return;
    }

    // If we've already hit the retry limit, don't try again
    if (retryCount.current >= MAX_RETRIES) {
      console.log(`[${new Date().toISOString()}] ReadingTracker: Max retries (${MAX_RETRIES}) reached, not attempting to mark as read again`);
      return;
    }

    const markAsRead = async () => {
      try {
        if (!isMounted.current) return;
        setIsUpdating(true);
        
        // Check if session is valid before marking as read
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.warn(`[${new Date().toISOString()}] ReadingTracker: No active session, attempting refresh`);
          const { data } = await supabase.auth.refreshSession();
          if (!data.session) {
            console.error(`[${new Date().toISOString()}] ReadingTracker: Failed to refresh session`);
            if (isMounted.current) {
              setIsUpdating(false);
              retryCount.current += 1;
            }
            return;
          }
        }
        
        console.log(`[${new Date().toISOString()}] ReadingTracker: Auto-marking post ${postId} as read for user ${user.id}`);
        const success = await togglePostReadStatus(user.id, postId, true);

        if (!success) {
          retryCount.current += 1;
          console.error(`[${new Date().toISOString()}] ReadingTracker: Error marking post as read (attempt ${retryCount.current}/${MAX_RETRIES})`);
          
          if (retryCount.current >= MAX_RETRIES) {
            console.log(`[${new Date().toISOString()}] ReadingTracker: Hit max retries (${MAX_RETRIES}), giving up`);
            // Show a toast but don't retry anymore to break the loop
            toast({
              title: "Couldn't mark as read",
              description: "Unable to update reading status due to a system error.",
              variant: "destructive",
            });
          }
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
        retryCount.current += 1;
        
        if (retryCount.current >= MAX_RETRIES) {
          toast({
            title: "Read Status Error",
            description: "Could not update reading status after multiple attempts.",
            variant: "destructive",
          });
        }
      } finally {
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
    if (!user || !postId || isUpdating) {
      console.log(`[${new Date().toISOString()}] ReadingTracker: Cannot toggle read status`, {
        hasUser: !!user,
        hasPostId: !!postId,
        isUpdateInProgress: isUpdating
      });
      return;
    }
    
    try {
      setIsUpdating(true);
      console.log(`[${new Date().toISOString()}] ReadingTracker: Manually toggling read status to ${!isRead}`);
      
      // Check if session is valid before toggling
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn(`[${new Date().toISOString()}] ReadingTracker: No active session, attempting refresh`);
        const { data } = await supabase.auth.refreshSession();
        if (!data.session) {
          console.error(`[${new Date().toISOString()}] ReadingTracker: Failed to refresh session`);
          toast({
            title: "Authentication Error",
            description: "Please log in again to update reading status",
            variant: "destructive",
          });
          if (isMounted.current) {
            setIsUpdating(false);
          }
          return;
        }
      }
      
      // Use the togglePostReadStatus function from the service
      const success = await togglePostReadStatus(user.id, postId, !isRead);
      
      if (!success) {
        console.error(`[${new Date().toISOString()}] ReadingTracker: Error toggling read status`);
        toast({
          title: "Error",
          description: "Failed to update reading status",
          variant: "destructive",
        });
        return;
      }
      
      console.log(`[${new Date().toISOString()}] ReadingTracker: Successfully toggled read status to ${!isRead}`);
      setIsRead(!isRead);
      toast({
        title: isRead ? "Marked as unread" : "Marked as read",
        description: isRead 
          ? "This post has been removed from your reading history" 
          : "This post has been added to your reading history",
      });
    } catch (err) {
      console.error(`[${new Date().toISOString()}] ReadingTracker: Error in toggleReadStatus:`, err);
      toast({
        title: "Error",
        description: "Failed to update reading status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return { 
    isRead, 
    isUpdating, 
    toggleReadStatus,
    checkReadStatus: async () => {
      if (!user || !postId) return;
      console.log(`[${new Date().toISOString()}] ReadingTracker: Manual check requested for post ${postId}`);
      const status = await isPostRead(user.id, postId);
      if (isMounted.current) {
        console.log(`[${new Date().toISOString()}] ReadingTracker: Manual check result: ${status}`);
        setIsRead(status);
      }
    }
  };
};
