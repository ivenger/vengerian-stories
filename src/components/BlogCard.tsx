
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BlogPost } from "../data/blogPosts";
import { Pencil } from "lucide-react";

interface BlogCardProps {
  post: BlogPost;
}

const BlogCard = ({ post }: BlogCardProps) => {
  const navigate = useNavigate();
  
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to blog post
    navigate(`/admin?editId=${post.id}`);
  };

  return (
    <article className="mb-12 relative">
      <Link to={`/blog/${post.id}`}>
        <h2 className="text-2xl font-semibold mb-2 hover:text-gray-700 transition-colors">
          {post.title}
        </h2>
      </Link>
      <div className="flex items-center text-sm text-gray-500 mb-4">
        <span>{post.date}</span>
        <span className="mx-2">•</span>
        <span>{post.language}</span>
      </div>
      <p className="text-gray-700">{post.excerpt}</p>
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
