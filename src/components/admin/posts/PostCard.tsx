
import React from "react";
import { Tag, Globe, XCircle, Trash2 } from "lucide-react";
import { BlogEntry } from "@/types/blogTypes";
import PostStatus from "./PostStatus";

interface PostCardProps {
  post: BlogEntry;
  onEdit: (post: BlogEntry) => void;
  onDelete: (postId: string) => void;
  onPublish: (post: BlogEntry) => void;
  onUnpublish: (post: BlogEntry) => void;
}

const PostCard = ({ post, onEdit, onDelete, onPublish, onUnpublish }: PostCardProps) => {
  return (
    <div 
      key={post.id}
      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-lg">{post.title}</h3>
            <PostStatus status={post.status || 'draft'} />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {post.date} • {post.language.join(', ')}
          </p>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {post.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full flex items-center"
                >
                  <Tag size={10} className="mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {post.status === "draft" ? (
            <button
              onClick={() => onPublish(post)}
              className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 transition-colors flex items-center gap-1"
              title="Publish post"
            >
              <Globe size={14} />
              Publish
            </button>
          ) : (
            <button
              onClick={() => onUnpublish(post)}
              className="text-sm bg-amber-100 text-amber-700 px-3 py-1 rounded hover:bg-amber-200 transition-colors flex items-center gap-1"
              title="Unpublish post"
            >
              <XCircle size={14} />
              Unpublish
            </button>
          )}
          <button
            onClick={() => onEdit(post)}
            className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(post.id)}
            className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition-colors flex items-center gap-1"
            title="Delete post"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>
      <p className="mt-2 text-gray-700">{post.excerpt}</p>
    </div>
  );
};

export default PostCard;
