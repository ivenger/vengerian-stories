import { useState, useEffect } from 'react';
import { BlogEntry } from '@/types/blogTypes';
import { fetchAllPosts, savePost, deletePost } from '@/services/postService';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseRequest } from '@/hooks/useSupabaseRequest';

export const usePostsManagement = (editId?: string) => {
  const [posts, setPosts] = useState<BlogEntry[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const {
    execute: fetchPosts,
    loading,
    error
  } = useSupabaseRequest(
    async () => {
      const fetchedPosts = await fetchAllPosts();
      setPosts(fetchedPosts);
      return fetchedPosts;
    },
    {
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to load blog posts. Please try again later.",
          variant: "destructive",
        });
      }
    }
  );

  const {
    execute: savePostWithStatus
  } = useSupabaseRequest(
    async (post: BlogEntry) => {
      const savedPost = await savePost(post);
      setPosts(prevPosts => {
        const index = prevPosts.findIndex(p => p.id === savedPost.id);
        if (index >= 0) {
          return [...prevPosts.slice(0, index), savedPost, ...prevPosts.slice(index + 1)];
        }
        return [...prevPosts, savedPost];
      });
      return savedPost;
    },
    {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Post saved successfully"
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to save post. Please try again.",
          variant: "destructive"
        });
      }
    }
  );

  const {
    execute: deletePostById
  } = useSupabaseRequest(
    async (id: string) => {
      await deletePost(id);
      setPosts(prevPosts => prevPosts.filter(p => p.id !== id));
    },
    {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Post deleted successfully"
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to delete post. Please try again.",
          variant: "destructive"
        });
      }
    }
  );

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

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
  }, [editId, posts, toast]);

  const createNewPost = () => {
    const newPost: BlogEntry = {
      id: '',
      title: 'New Post',
      content: '',
      date: new Date().toISOString(),
      status: 'draft',
      language: ['en'],
      title_language: ['en'],
      tags: [],
      translations: null,
      excerpt: null,
      image_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setSelectedPost(newPost);
    setIsEditing(true);
  };

  const editPost = (post: BlogEntry) => {
    setSelectedPost({...post});
    setIsEditing(true);
  };

  const publishPost = async (post: BlogEntry) => {
    await savePostWithStatus({
      ...post,
      status: 'published',
      updated_at: new Date().toISOString()
    });
  };

  const unpublishPost = async (post: BlogEntry) => {
    await savePostWithStatus({
      ...post,
      status: 'draft',
      updated_at: new Date().toISOString()
    });
  };

  const handleDeletePost = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      await deletePostById(id);
    }
  };

  return {
    posts,
    loading,
    error,
    selectedPost,
    isEditing,
    createNewPost,
    editPost,
    publishPost,
    unpublishPost,
    handleDeletePost,
    savePost: savePostWithStatus,
    setSelectedPost,
    setIsEditing
  };
};
