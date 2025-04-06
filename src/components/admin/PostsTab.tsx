
import React from "react";
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
