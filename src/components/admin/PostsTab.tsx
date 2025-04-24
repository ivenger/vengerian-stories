
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BlogEntry } from "@/types/blogTypes";
import PostsList from "./posts/PostsList";
import { usePostsManagement } from "./posts/usePostsManagement";

interface PostsTabProps {
  editId: string | null;
  setIsEditing: (isEditing: boolean) => void;
  setSelectedPost: (post: BlogEntry | null) => void;
}

const PostsTab = ({ editId, setIsEditing, setSelectedPost }: PostsTabProps) => {
  const navigate = useNavigate();
  const {
    posts,
    loading,
    createNewPost,
    editPost,
    publishPost,
    unpublishPost,
    handleDeletePost
  } = usePostsManagement(editId, setIsEditing, setSelectedPost);

  // Prevent showing empty state during initial load
  const [showContent, setShowContent] = useState(false);
  
  useEffect(() => {
    // Only show content after initial loading is complete
    // or after a short delay to prevent flickering
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);

  if (!showContent) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">All Posts</h2>
        <button
          onClick={createNewPost}
          className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
        >
          Create New Post
        </button>
      </div>
      
      <PostsList 
        posts={posts} 
        loading={loading}
        onEdit={editPost}
        onDelete={handleDeletePost}
        onPublish={publishPost}
        onUnpublish={unpublishPost}
      />
    </div>
  );
};

export default PostsTab;
