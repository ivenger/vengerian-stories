
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BlogEntry } from "../types/blogTypes";
import { Pencil, Globe, FileText } from "lucide-react";

interface BlogCardProps {
  post: BlogEntry;
}

const BlogCard = ({
  post
}: BlogCardProps) => {
  const navigate = useNavigate();
  
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to blog post
    navigate(`/admin?editId=${post.id}`);
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
        {typeof post.content === 'string' 
          ? post.content.substring(0, 150).replace(/<[^>]*>?/gm, '') + '...'
          : 'Read more...'}
      </p>
      
      <div className="flex justify-between items-center mt-4">
        <Link 
          to={`/blog/${post.id}`} 
          className="inline-block text-sm font-medium text-gray-700 hover:text-black transition-colors"
        >
          Continue reading →
        </Link>
        
        <button 
          onClick={handleEdit} 
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors" 
          title="Edit post"
        >
          <Pencil size={14} />
          <span>Edit</span>
        </button>
      </div>
    </article>
  );
};

export default BlogCard;
