
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { BlogEntry } from "@/types/blogTypes";
import { savePost, deletePost } from "@/services/blogService";
import { useAuth } from "@/hooks/auth/useAuth";
import { useSessionRefresh } from "@/hooks/filters/useSessionRefresh";
import { useNavigate } from "react-router-dom";

export const usePostOperations = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const { refreshSession } = useSessionRefresh();

  const publishPost = async (post: BlogEntry) => {
    try {
      console.log(`usePostOperations: Publishing post: ${post.title}`);
      
      await refreshSession();
      
      const updatedPost = { 
        ...post, 
        status: "published" as const,
        user_id: post.user_id || user?.id
      };
      
      const savedPost = await savePost(updatedPost);
      
      toast({
        title: "Success",
        description: `"${post.title}" has been published.`,
      });
      console.log(`usePostOperations: Post published successfully`);
      return savedPost;
    } catch (error) {
      console.error("usePostOperations: Error publishing post:", error);
      toast({
        title: "Error",
        description: "Failed to publish post. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const unpublishPost = async (post: BlogEntry) => {
    try {
      console.log(`usePostOperations: Unpublishing post: ${post.title}`);
      
      await refreshSession();
      
      const updatedPost = { 
        ...post, 
        status: "draft" as const,
        user_id: post.user_id || user?.id
      };
      
      const savedPost = await savePost(updatedPost);
      
      toast({
        title: "Success",
        description: `"${post.title}" has been unpublished and is now a draft.`,
      });
      console.log(`usePostOperations: Post unpublished successfully`);
      return savedPost;
    } catch (error) {
      console.error("usePostOperations: Error unpublishing post:", error);
      toast({
        title: "Error",
        description: "Failed to unpublish post. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      try {
        console.log(`usePostOperations: Deleting post with ID: ${postId}`);
        await refreshSession();
        await deletePost(postId);
        
        toast({
          title: "Success",
          description: "Post has been deleted.",
        });
        console.log(`usePostOperations: Post deleted successfully`);
      } catch (error) {
        console.error("usePostOperations: Error deleting post:", error);
        toast({
          title: "Error",
          description: "Failed to delete post. Please try again.",
          variant: "destructive"
        });
        throw error;
      }
    }
  };

  return {
    publishPost,
    unpublishPost,
    handleDeletePost,
    isSaving
  };
};
