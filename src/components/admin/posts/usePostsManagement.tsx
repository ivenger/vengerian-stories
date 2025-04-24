
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { BlogEntry } from "@/types/blogTypes";
import { format } from "date-fns";
import { fetchAllPosts, savePost, deletePost } from "@/services/postService";
import { useAuth } from "@/hooks/auth/useAuth";
import { useSessionRefresh } from "@/hooks/filters/useSessionRefresh";

export const usePostsManagement = (editId: string | null, setIsEditing: (isEditing: boolean) => void, setSelectedPost: (post: BlogEntry | null) => void) => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { refreshSession } = useSessionRefresh();

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      console.log("PostsManagement: Loading all posts");
      
      // Try to refresh the session before loading posts
      await refreshSession();
      
      const allPosts = await fetchAllPosts();
      setPosts(allPosts);
      console.log(`PostsManagement: Loaded ${allPosts.length} posts`);
      return allPosts;
    } catch (error) {
      console.error("PostsManagement: Failed to load posts:", error);
      toast({
        title: "Error",
        description: "Failed to load blog posts. Please try again later.",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast, refreshSession]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    if (editId && posts.length > 0) {
      console.log(`PostsManagement: Looking for post with ID ${editId}`);
      const postToEdit = posts.find(p => p.id === editId);
      if (postToEdit) {
        console.log(`PostsManagement: Found post to edit: ${postToEdit.title}`);
        setSelectedPost({...postToEdit});
        setIsEditing(true);
      } else {
        console.error(`PostsManagement: Post with ID ${editId} not found`);
        toast({
          title: "Error",
          description: `Post with ID ${editId} not found.`,
          variant: "destructive"
        });
      }
    }
  }, [editId, posts, toast, setIsEditing, setSelectedPost]);

  const createNewPost = () => {
    if (!user) {
      console.error("PostsManagement: No user found when creating new post");
      toast({
        title: "Error",
        description: "You must be logged in to create posts",
        variant: "destructive"
      });
      return;
    }

    console.log("PostsManagement: Creating new post for user:", user.id);
    const newPost: BlogEntry = {
      id: crypto.randomUUID(),
      title: "New Post Title",
      excerpt: "Brief description of your post",
      content: "Start writing your post here...",
      date: format(new Date(), "MMMM d, yyyy"),
      language: ["English"],
      title_language: ["en"],
      status: "draft",
      translations: [],
      user_id: user.id
    };
    
    setSelectedPost(newPost);
    setIsEditing(true);
  };

  const editPost = (post: BlogEntry) => {
    console.log(`PostsManagement: Editing post: ${post.title}`);
    
    // Make sure the post has a user_id
    const postWithUserId = {
      ...post,
      user_id: post.user_id || user?.id
    };
    
    setSelectedPost(postWithUserId);
    setIsEditing(true);
  };

  const publishPost = async (post: BlogEntry) => {
    try {
      console.log(`PostsManagement: Publishing post: ${post.title}`);
      
      // Try to refresh the session before saving
      await refreshSession();
      
      const updatedPost = { 
        ...post, 
        status: "published" as const,
        user_id: post.user_id || user?.id
      };
      
      const savedPost = await savePost(updatedPost);
      
      setPosts(prevPosts => 
        prevPosts.map(p => p.id === savedPost.id ? savedPost : p)
      );
      
      toast({
        title: "Success",
        description: `"${post.title}" has been published.`,
      });
      console.log(`PostsManagement: Post published successfully`);
    } catch (error) {
      console.error("PostsManagement: Error publishing post:", error);
      toast({
        title: "Error",
        description: "Failed to publish post. Please try again.",
        variant: "destructive"
      });
    }
  };

  const unpublishPost = async (post: BlogEntry) => {
    try {
      console.log(`PostsManagement: Unpublishing post: ${post.title}`);
      
      // Try to refresh the session before saving
      await refreshSession();
      
      const updatedPost = { 
        ...post, 
        status: "draft" as const,
        user_id: post.user_id || user?.id
      };
      
      const savedPost = await savePost(updatedPost);
      
      setPosts(prevPosts => 
        prevPosts.map(p => p.id === savedPost.id ? savedPost : p)
      );
      
      toast({
        title: "Success",
        description: `"${post.title}" has been unpublished and is now a draft.`,
      });
      console.log(`PostsManagement: Post unpublished successfully`);
    } catch (error) {
      console.error("PostsManagement: Error unpublishing post:", error);
      toast({
        title: "Error",
        description: "Failed to unpublish post. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      try {
        console.log(`PostsManagement: Deleting post with ID: ${postId}`);
        
        // Try to refresh the session before deleting
        await refreshSession();
        
        await deletePost(postId);
        setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
        
        toast({
          title: "Success",
          description: "Post has been deleted.",
        });
        console.log(`PostsManagement: Post deleted successfully`);
      } catch (error) {
        console.error("PostsManagement: Error deleting post:", error);
        toast({
          title: "Error",
          description: "Failed to delete post. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  return {
    posts,
    loading,
    loadPosts,
    createNewPost,
    editPost,
    publishPost,
    unpublishPost,
    handleDeletePost
  };
};
