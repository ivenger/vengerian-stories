
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to fetch and manage reading history for a user
 */
export const useReadingHistory = (user: User | null) => {
  const [readPostIds, setReadPostIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setReadPostIds([]);
      return;
    }
    
    let isMounted = true;
    setLoading(true);
    
    const fetchReadPosts = async () => {
      try {
        console.log("Fetching reading history for user:", user.id);
        const { data, error } = await supabase
          .from('reading_history')
          .select('id, user_id, post_id, read_at')
          .eq('user_id', user.id);
          
        if (error) {
          if (error.code === '406') {
            console.warn("useReadingHistory: 406 Not Acceptable error - continuing without reading history");
            if (isMounted) {
              setReadPostIds([]);
            }
          } else {
            console.error("useReadingHistory: Error fetching reading history:", error);
          }
          return;
        }
        
        console.log("Reading history fetched:", data?.length || 0, "items");
        if (isMounted) {
          setReadPostIds((data || []).map(item => item.post_id));
        }
      } catch (err) {
        console.error("Error fetching reading history:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchReadPosts();
    
    return () => {
      isMounted = false;
    };
  }, [user]);

  return {
    readPostIds,
    loading
  };
};
