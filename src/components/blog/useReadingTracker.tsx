
import { useState, useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";

export const useReadingTracker = (postId: string | undefined, user: User | null) => {
  const [isRead, setIsRead] = useState(false);
  const mountedRef = useRef(true);
  const { toast } = useToast();
  const markingInProgressRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Check if post is already marked as read
  useEffect(() => {
    if (!user || !postId) {
      console.log("ReadingTracker: Not checking read status because user or postId is missing");
      return;
    }
    
    const checkReadStatus = async () => {
      try {
        console.log(`ReadingTracker: Checking read status for user ${user.id} and post ${postId}`);
        const { data, error } = await supabase
          .from('reading_history')
          .select('*')
          .eq('user_id', user.id)
          .eq('post_id', postId)
          .maybeSingle();
          
        if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows returned"
          console.error("ReadingTracker: Error checking read status:", error);
        } else if (mountedRef.current) {
          console.log(`ReadingTracker: Read status is ${!!data}`);
          setIsRead(!!data);
        }
      } catch (readErr) {
        console.error("ReadingTracker: Error checking read status:", readErr);
      }
    };
    
    checkReadStatus();
  }, [postId, user]);

  // Mark post as read when it loads
  useEffect(() => {
    if (!user || !postId || isRead || markingInProgressRef.current) {
      console.log("ReadingTracker: Not marking as read because:", 
        !user ? "no user" : !postId ? "no postId" : isRead ? "already read" : "marking in progress");
      return;
    }
    
    const markAsRead = async () => {
      if (markingInProgressRef.current) return;
      markingInProgressRef.current = true;
      
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
          
          // Only show toast for client-visible errors
          if (error.code !== '406' && mountedRef.current) {
            toast({
              title: "Note",
              description: "Unable to update reading history. This won't affect your reading experience.",
              variant: "default"
            });
          }
          return;
        }
        
        if (mountedRef.current) {
          console.log("ReadingTracker: Successfully marked post as read");
          setIsRead(true);
        }
      } catch (err) {
        console.error("ReadingTracker: Error in markAsRead:", err);
      } finally {
        markingInProgressRef.current = false;
      }
    };
    
    // Only try to mark as read if we have all required data
    markAsRead();
  }, [postId, user, isRead, toast]);

  return { isRead };
};
