
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BlogEntry } from "@/types/blogTypes";
import PostsList from "./posts/PostsList";
import { usePostsManagement } from "./posts/usePostsManagement";
import { useIsMobile } from "@/hooks/use-mobile";

interface PostsTabProps {
  editId: string | null;
  setIsEditing: (isEditing: boolean) => void;
  setSelectedPost: (post: BlogEntry | null) => void;
}

const PostsTab = ({ editId, setIsEditing, setSelectedPost }: PostsTabProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const {
    posts,
    loading,
    error,
    createNewPost,
    editPost,
    publishPost,
    unpublishPost,
    handleDeletePost
  } = usePostsManagement(editId, setIsEditing, setSelectedPost);

  console.log("PostsTab: Rendering with screen type:", isMobile ? "mobile" : "desktop");

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        <p className="text-gray-600">Loading posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
        <div className="text-red-500 text-xl">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-900">Error Loading Posts</h3>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm text-gray-900"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Posts Yet</h3>
        <p className="text-gray-600 mb-6">Get started by creating your first blog post.</p>
        <button
          onClick={() => createNewPost()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create New Post
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className={`flex ${isMobile ? 'flex-col' : 'justify-between'} items-center mb-6`}>
        <h2 className={`text-xl font-semibold ${isMobile ? 'mb-4' : ''}`}>All Posts</h2>
        <button
          onClick={createNewPost}
          className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors w-full sm:w-auto"
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
