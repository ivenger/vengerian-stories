
import { BlogPost } from "../../data/blogPosts";
import { Globe, FileText } from "lucide-react";
import PostActions from "./PostActions";

interface PostItemProps {
  post: BlogPost;
  onEditPost: (post: BlogPost) => void;
  onDeletePost: (postId: string) => void;
  onPublishPost: (post: BlogPost) => void;
  onUnpublishPost: (post: BlogPost) => void;
}

const PostItem = ({ 
  post, 
  onEditPost, 
  onDeletePost,
  onPublishPost,
  onUnpublishPost
}: PostItemProps) => {
  // Get status tag color
  const getStatusColor = (status: string) => {
    return status === "published" 
      ? "bg-green-100 text-green-800" 
      : "bg-amber-100 text-amber-800";
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    return status === "published" 
      ? <Globe size={16} className="text-green-700" /> 
      : <FileText size={16} className="text-amber-700" />;
  };

  return (
    <div 
      key={post.id}
      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-lg">{post.title}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(post.status || 'draft')}`}>
              {getStatusIcon(post.status || 'draft')}
              {post.status || 'draft'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {post.date} • {post.language}
          </p>
        </div>
        <PostActions 
          post={post}
          onEditPost={onEditPost}
          onDeletePost={onDeletePost}
          onPublishPost={onPublishPost}
          onUnpublishPost={onUnpublishPost}
        />
      </div>
      <p className="mt-2 text-gray-700">{post.excerpt}</p>
    </div>
  );
};

export default PostItem;
