
import React from 'react';
import { Link } from 'react-router-dom';
import { BlogEntry } from '@/types/blogTypes';
import { Calendar } from 'lucide-react';

// Function to detect if text has Cyrillic characters
const hasCyrillic = (text: string): boolean => {
  return /[А-Яа-яЁё]/.test(text);
};

interface BlogCardProps {
  post: BlogEntry;
}

const BlogCard: React.FC<BlogCardProps> = ({ post }) => {
  const { id, title, date, excerpt, image_url, tags } = post;
  
  // Determine the appropriate font class based on the content
  const titleFontClass = hasCyrillic(title) ? 'font-cursive-cyrillic' : 'font-cursive';
  
  return (
    <Link to={`/blog/${id}`} className="block group">
      <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm transition-all hover:shadow-md">
        {image_url && (
          <div className="aspect-video w-full overflow-hidden">
            <img 
              src={image_url} 
              alt={title} 
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
        
        <div className="p-4">
          <h2 className={`${titleFontClass} text-xl text-gray-900 mb-2`}>
            {title}
          </h2>
          
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <Calendar size={14} className="mr-1" />
            <span>{date}</span>
          </div>
          
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {tags.map((tag, index) => (
                <span 
                  key={index} 
                  className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {excerpt && (
            <p className="text-gray-600 text-sm line-clamp-3">
              {excerpt}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default BlogCard;
