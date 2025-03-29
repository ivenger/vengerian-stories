
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { BlogEntry } from "@/types/blogTypes";
import { format } from "date-fns";
import { fetchAllPosts, savePost, deletePost } from "@/services/postService";

export const usePostsManagement = (editId: string | null, setIsEditing: (isEditing: boolean) => void, setSelectedPost: (post: BlogEntry | null) => void) => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        console.log("PostsManagement: Loading all posts");
        const allPosts = await fetchAllPosts();
        setPosts(allPosts);
        console.log(`PostsManagement: Loaded ${allPosts.length} posts`);
      } catch (error) {
        console.error("PostsManagement: Failed to load posts:", error);
        toast({
          title: "Error",
          description: "Failed to load blog posts. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [toast]);

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
    console.log("PostsManagement: Creating new post");
    const newPost: BlogEntry = {
      id: crypto.randomUUID(),
      title: "New Post Title",
      excerpt: "Brief description of your post",
      content: "Start writing your post here...",
      date: format(new Date(), "MMMM d, yyyy"),
      language: ["English"],
      title_language: ["en"],
      status: "draft",
      translations: []
    };
    
    setSelectedPost(newPost);
    setIsEditing(true);
  };

  const editPost = (post: BlogEntry) => {
    console.log(`PostsManagement: Editing post: ${post.title}`);
    setSelectedPost({...post});
    setIsEditing(true);
  };

  const publishPost = async (post: BlogEntry) => {
    try {
      console.log(`PostsManagement: Publishing post: ${post.title}`);
      const updatedPost = { ...post, status: "published" as const };
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
      const updatedPost = { ...post, status: "draft" as const };
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
    createNewPost,
    editPost,
    publishPost,
    unpublishPost,
    handleDeletePost
  };
};
