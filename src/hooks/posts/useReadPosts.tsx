
import { useState, useEffect, useRef } from 'react';
import { useAuth } from "../../components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

export const useReadPosts = () => {
  const { user } = useAuth();
  const [readPostIds, setReadPostIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);
  const fetchInProgressRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Cleanup on unmount
  useEffect(() => {
    console.log("useReadPosts mounted");
    mountedRef.current = true;
    fetchInProgressRef.current = false;
    
    return () => {
      console.log("useReadPosts unmounted - cleaning up");
      mountedRef.current = false;
      
      // Cancel any in-progress fetch
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      fetchInProgressRef.current = false;
    };
  }, []);

  // Fetch reading history if user is logged in
  useEffect(() => {
    if (!user) {
      setReadPostIds([]);
      return;
    }
    
    // Skip if a fetch is already in progress or component is unmounting
    if (fetchInProgressRef.current || !mountedRef.current) {
      console.log("Reading history fetch skipped - already in progress or component unmounting");
      return;
    }
    
    const fetchReadPosts = async () => {
      if (!mountedRef.current) return;
      
      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller
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
          return; // Don't throw, just return
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
        // Non-critical, don't set error state
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
        fetchInProgressRef.current = false;
      }
    };
    
    fetchReadPosts();
    
    // Cleanup function to cancel fetch when user changes or component unmounts
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
