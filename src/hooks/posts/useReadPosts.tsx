
import { useState, useEffect, useRef } from 'react';
import { useAuth } from "../../components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

export const useReadPosts = () => {
  const { user } = useAuth();
  const [readPostIds, setReadPostIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);
  const fetchInProgressRef = useRef(false);
  
  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Fetch reading history if user is logged in
  useEffect(() => {
    if (!user) {
      setReadPostIds([]);
      return;
    }
    
    // Skip if a fetch is already in progress
    if (fetchInProgressRef.current) {
      console.log("Reading history fetch already in progress, skipping duplicate request");
      return;
    }
    
    const fetchReadPosts = async () => {
      if (!mountedRef.current) return;
      
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
        
        if (!mountedRef.current) return;
        
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
  }, [user]);

  return {
    readPostIds,
    isReadPostsLoading: loading,
    hasReadPost: (postId: string) => readPostIds.includes(postId)
  };
};
