
import { BlogPost } from "../../data/blogPosts";
import { Globe, XCircle, Trash2 } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

interface PostActionsProps {
  post: BlogPost;
  onEditPost: (post: BlogPost) => void;
  onDeletePost: (postId: string) => void;
  onPublishPost: (post: BlogPost) => void;
  onUnpublishPost: (post: BlogPost) => void;
}

const PostActions = ({ 
  post, 
  onEditPost, 
  onDeletePost, 
  onPublishPost, 
  onUnpublishPost 
}: PostActionsProps) => {
  return (
    <div className="flex items-center space-x-2">
      {post.status === "draft" ? (
        <button
          onClick={() => onPublishPost(post)}
          className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 transition-colors flex items-center gap-1"
          title="Publish post"
        >
          <Globe size={14} />
          Publish
        </button>
      ) : (
        <button
          onClick={() => onUnpublishPost(post)}
          className="text-sm bg-amber-100 text-amber-700 px-3 py-1 rounded hover:bg-amber-200 transition-colors flex items-center gap-1"
          title="Unpublish post"
        >
          <XCircle size={14} />
          Unpublish
        </button>
      )}
      <button
        onClick={() => onEditPost(post)}
        className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200 transition-colors"
      >
        Edit
      </button>
      <button
        onClick={() => onDeletePost(post.id)}
        className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition-colors flex items-center gap-1"
        title="Delete post"
      >
        <Trash2 size={14} />
        Delete
      </button>
    </div>
  );
};

export default PostActions;
