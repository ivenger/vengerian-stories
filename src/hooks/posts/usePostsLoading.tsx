
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { BlogEntry } from "@/types/blogTypes";
import { fetchAllPosts } from "@/services/blogService";
import { useAuth } from "@/hooks/auth/useAuth";
import { useSessionRefresh } from "@/hooks/filters/useSessionRefresh";

export const usePostsLoading = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAuth();
  const { refreshSession } = useSessionRefresh();

  const loadPosts = useCallback(async () => {
    if (!isAdmin) {
      console.log("usePostsLoading: User is not admin, skipping load");
      setError("Admin access required");
      setLoading(false);
      return [];
    }

    try {
      setLoading(true);
      setError(null);
      console.log("usePostsLoading: Loading all posts as admin");
      
      await refreshSession();
      
      const allPosts = await fetchAllPosts();
      setPosts(allPosts);
      console.log(`usePostsLoading: Loaded ${allPosts.length} posts successfully`);
      return allPosts;
    } catch (error: any) {
      console.error("usePostsLoading: Failed to load posts:", error);
      const errorMessage = error?.message || "Failed to load blog posts";
      setError(errorMessage);
      toast({
        title: "Error Loading Posts",
        description: errorMessage,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast, refreshSession, isAdmin]);

  return {
    posts,
    setPosts,
    loading,
    error,
    loadPosts
  };
};
