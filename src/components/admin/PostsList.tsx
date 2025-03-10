
import { useState } from "react";
import { BlogPost } from "../../data/blogPosts";
import PostItem from "./PostItem";

interface PostsListProps {
  posts: BlogPost[];
  onEditPost: (post: BlogPost) => void;
  onDeletePost: (postId: string) => void;
  onPublishPost: (post: BlogPost) => void;
  onUnpublishPost: (post: BlogPost) => void;
  onCreateNewPost: () => void;
}

const PostsList = ({ 
  posts,
  onEditPost,
  onDeletePost,
  onPublishPost,
  onUnpublishPost,
  onCreateNewPost
}: PostsListProps) => {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">All Posts</h2>
        <button
          onClick={onCreateNewPost}
          className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
        >
          Create New Post
        </button>
      </div>
      
      <div className="grid gap-4">
        {posts.map((post) => (
          <PostItem 
            key={post.id}
            post={post}
            onEditPost={onEditPost}
            onDeletePost={onDeletePost}
            onPublishPost={onPublishPost}
            onUnpublishPost={onUnpublishPost}
          />
        ))}
      </div>
    </>
  );
};

export default PostsList;
