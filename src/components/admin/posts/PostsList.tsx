
import React from "react";
import { BlogEntry } from "@/types/blogTypes";
import { Spinner } from "@/components/ui/spinner";
import PostCard from "./PostCard";

interface PostsListProps {
  posts: BlogEntry[];
  loading: boolean;
  onEdit: (post: BlogEntry) => void;
  onDelete: (postId: string) => void;
  onPublish: (post: BlogEntry) => void;
  onUnpublish: (post: BlogEntry) => void;
}

const PostsList = ({ 
  posts, 
  loading, 
  onEdit, 
  onDelete, 
  onPublish, 
  onUnpublish 
}: PostsListProps) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No posts found. Create your first post using the button above.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {posts.map((post) => (
        <PostCard 
          key={post.id}
          post={post}
          onEdit={onEdit}
          onDelete={onDelete}
          onPublish={onPublish}
          onUnpublish={onUnpublish}
        />
      ))}
    </div>
  );
};

export default PostsList;
