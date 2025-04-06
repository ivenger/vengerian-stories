import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { hasReadPost, markPostAsRead } from '@/services/postService';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseRequest } from '@/hooks/useSupabaseRequest';

export function useReadingTracker(postId?: string, user?: User | null) {
  const [isRead, setIsRead] = useState(false);
  const { toast } = useToast();

  const {
    execute: checkReadStatus,
    loading: checkingStatus
  } = useSupabaseRequest(
    async () => {
      if (!postId || !user) return false;
      const readStatus = await hasReadPost(user.id, postId);
      setIsRead(readStatus);
      return readStatus;
    },
    {
      onError: () => {
        console.error("Failed to check read status");
        setIsRead(false);
      }
    }
  );

  const {
    execute: markRead,
    loading: markingRead
  } = useSupabaseRequest(
    async () => {
      if (!postId || !user) return;
      await markPostAsRead(user.id, postId);
      setIsRead(true);
    },
    {
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to mark post as read. Please try again.",
          variant: "destructive"
        });
      }
    }
  );

  useEffect(() => {
    if (postId && user) {
      checkReadStatus();
    } else {
      setIsRead(false);
    }
  }, [postId, user, checkReadStatus]);

  return {
    isRead,
    markRead,
    loading: checkingStatus || markingRead
  };
}
