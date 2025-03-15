
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BlogEntry } from "../types/blogTypes";
import { Pencil, Globe, FileText } from "lucide-react";
import { savePost } from "../services/blogService";
import { useToast } from "@/components/ui/use-toast";

interface BlogCardProps {
  post: BlogEntry;
  onPostUpdated?: (post: BlogEntry) => void;
}

const BlogCard = ({
  post,
  onPostUpdated
}: BlogCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isPublishing, setIsPublishing] = useState(false);
  
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to blog post
    navigate(`/admin?editId=${post.id}`);
  };

  const handlePublish = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setIsPublishing(true);
      const updatedPost = { ...post, status: "published" };
      const publishedPost = await savePost(updatedPost);
      
      toast({
        title: "Success",
        description: "Post published successfully."
      });
      
      if (onPostUpdated) {
        onPostUpdated(publishedPost);
      }
    } catch (error) {
      console.error("Error publishing post:", error);
      toast({
        title: "Error",
        description: "Failed to publish post."
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Get main image if available
  const imageUrl = post.image_url || null;
  
  return (
    <article className="mb-12 relative bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2">
        <Link to={`/blog/${post.id}`} className="flex-grow">
          <h2 className="text-2xl font-cursive font-semibold mb-2 hover:text-gray-700 transition-colors">
            {post.title}
          </h2>
        </Link>
      </div>
      
      <div className="flex items-center text-sm text-gray-500 mb-4">
        <span>{post.date}</span>
        <span className="mx-2">•</span>
        <span>{Array.isArray(post.language) ? post.language.join(', ') : post.language}</span>
        {post.status === "draft" && (
          <>
            <span className="mx-2">•</span>
            <span className="text-amber-600">Draft</span>
          </>
        )}
      </div>
      
      {imageUrl && (
        <div className="mb-4">
          <img 
            src={imageUrl} 
            alt={post.title} 
            className="w-full h-48 object-cover rounded-md"
          />
        </div>
      )}
      
      <p className="text-gray-700">
        {post.excerpt || (post.content ? post.content.substring(0, 150).replace(/<[^>]*>?/gm, '') + '...' : 'Read more...')}
      </p>
      
      <div className="flex justify-between items-center mt-4">
        <Link 
          to={`/blog/${post.id}`} 
          className="inline-block text-sm font-medium text-gray-700 hover:text-black transition-colors"
        >
          Continue reading →
        </Link>
        
        <div className="flex items-center gap-2">
          {post.status === "draft" && (
            <button 
              onClick={handlePublish}
              disabled={isPublishing}
              className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800 transition-colors"
              title="Publish post"
            >
              <Globe size={14} />
              <span>{isPublishing ? "Publishing..." : "Publish"}</span>
            </button>
          )}
          <button 
            onClick={handleEdit} 
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors" 
            title="Edit post"
          >
            <Pencil size={14} />
            <span>Edit</span>
          </button>
        </div>
      </div>
    </article>
  );
};

export default BlogCard;
