
import { useState, useEffect } from 'react';
import { useAuth } from "../../components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

export const useReadPosts = () => {
  const { user } = useAuth();
  const [readPostIds, setReadPostIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch reading history if user is logged in
  useEffect(() => {
    if (!user) {
      setReadPostIds([]);
      return;
    }
    
    const fetchReadPosts = async () => {
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
        
        console.log("Reading history fetched:", data?.length || 0, "items");
        setReadPostIds((data || []).map(item => item.post_id));
      } catch (err) {
        console.error("Error fetching reading history:", err);
        // Non-critical, don't set error state
      } finally {
        setLoading(false);
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
