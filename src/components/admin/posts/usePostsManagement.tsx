
import { useEffect } from "react";
import { BlogEntry } from "@/types/blogTypes";
import { usePostsLoading } from "@/hooks/posts/usePostsLoading";
import { usePostOperations } from "@/hooks/posts/usePostOperations";
import { usePostEditing } from "@/hooks/posts/usePostEditing";
import { useAuth } from "@/hooks/auth/useAuth";

export const usePostsManagement = (
  editId: string | null, 
  setIsEditing: (isEditing: boolean) => void, 
  setSelectedPost: (post: BlogEntry | null) => void
) => {
  const { isAdmin } = useAuth();
  const { posts, loading, error, loadPosts, setPosts } = usePostsLoading();
  const { publishPost, unpublishPost, handleDeletePost } = usePostOperations();
  const { createNewPost, editPost } = usePostEditing(editId, posts, setIsEditing, setSelectedPost);

  // Load posts when component mounts or admin status changes
  useEffect(() => {
    if (isAdmin) {
      loadPosts();
    }
  }, [loadPosts, isAdmin]);

  return {
    posts,
    loading,
    error,
    loadPosts,
    createNewPost,
    editPost,
    publishPost: async (post: BlogEntry) => {
      const updatedPost = await publishPost(post);
      setPosts(prevPosts => 
        prevPosts.map(p => p.id === updatedPost.id ? updatedPost : p)
      );
    },
    unpublishPost: async (post: BlogEntry) => {
      const updatedPost = await unpublishPost(post);
      setPosts(prevPosts => 
        prevPosts.map(p => p.id === updatedPost.id ? updatedPost : p)
      );
    },
    handleDeletePost: async (postId: string) => {
      await handleDeletePost(postId);
      setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
    }
  };
};
