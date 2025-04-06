
import { useState, useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const useReadPosts = () => {
  const [readPostIds, setReadPostIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);
  
  useEffect(() => {
    console.log("useReadPosts mounted");
    mountedRef.current = true;
    
    return () => {
      console.log("useReadPosts unmounted - cleaning up");
      mountedRef.current = false;
    };
  }, []);

  return {
    readPostIds,
    isReadPostsLoading: loading,
    hasReadPost: (postId: string) => readPostIds.includes(postId),
    clearReadPosts: () => setReadPostIds([])
  };
};
