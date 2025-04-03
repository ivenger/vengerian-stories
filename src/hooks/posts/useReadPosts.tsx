import { useState, useEffect, useRef } from 'react';
import { useAuthContext } from "../../components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

export const useReadPosts = () => {
  const { user } = useAuthContext();
  const [readPostIds, setReadPostIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);
  const fetchInProgressRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  useEffect(() => {
    console.log("useReadPosts mounted");
    mountedRef.current = true;
    fetchInProgressRef.current = false;
    
    return () => {
      console.log("useReadPosts unmounted - cleaning up");
      mountedRef.current = false;
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      fetchInProgressRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setReadPostIds([]);
      return;
    }
    
    if (fetchInProgressRef.current || !mountedRef.current) {
      console.log("Reading history fetch skipped - already in progress or component unmounting");
      return;
    }
    
    const fetchReadPosts = async () => {
      if (!mountedRef.current) return;
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      fetchInProgressRef.current = true;
      setLoading(true);
      
      try {
        console.log("Fetching reading history for user:", user.id);
        const { data, error } = await supabase
          .from('reading_history')
          .select('post_id')
          .eq('user_id', user.id);
          
        if (error) {
          console.error("Error fetching reading history:", error);
          return;
        }
        
        if (!mountedRef.current) {
          console.log("Component unmounted during reading history fetch");
          return;
        }
        
        console.log("Reading history fetched:", data?.length || 0, "items");
        setReadPostIds((data || []).map(item => item.post_id));
      } catch (err) {
        if (!mountedRef.current) return;
        
        console.error("Error fetching reading history:", err);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
        fetchInProgressRef.current = false;
      }
    };
    
    fetchReadPosts();
    
    return () => {
      if (abortControllerRef.current) {
        console.log("Cancelling in-progress reading history fetch due to user change");
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [user]);

  return {
    readPostIds,
    isReadPostsLoading: loading,
    hasReadPost: (postId: string) => readPostIds.includes(postId),
    clearReadPosts: () => setReadPostIds([])
  };
};
