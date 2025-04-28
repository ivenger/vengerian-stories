
import { useEffect } from "react";
import { BlogEntry } from "@/types/blogTypes";
import { useAuth } from "@/hooks/auth/useAuth";
import { format } from "date-fns";

export const usePostEditing = (
  editId: string | null,
  posts: BlogEntry[],
  setIsEditing: (isEditing: boolean) => void,
  setSelectedPost: (post: BlogEntry | null) => void
) => {
  const { user } = useAuth();

  // Handle edit mode based on URL param
  useEffect(() => {
    if (editId && posts.length > 0) {
      console.log(`usePostEditing: Looking for post with ID ${editId}`);
      const postToEdit = posts.find(p => p.id === editId);
      if (postToEdit) {
        console.log(`usePostEditing: Found post to edit: ${postToEdit.title}`);
        setSelectedPost(postToEdit);
        setIsEditing(true);
      }
    }
  }, [editId, posts, setSelectedPost, setIsEditing]);

  const createNewPost = () => {
    if (!user) {
      console.error("usePostEditing: No user found when creating new post");
      return;
    }

    console.log("usePostEditing: Creating new post for user:", user.id);
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
    console.log(`usePostEditing: Editing post: ${post.title}`);
    const postWithUserId = {
      ...post,
      user_id: post.user_id || user?.id
    };
    setSelectedPost(postWithUserId);
    setIsEditing(true);
  };

  return {
    createNewPost,
    editPost
  };
};
