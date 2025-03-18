
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
  const titleFontClass = hasCyrillic(title) ? 'font-cursive-cyrillic' : 'font-caraterre';
  
  return (
    <div className="flex justify-center w-full">
      <Link to={`/blog/${id}`} className="block w-full group">
        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-2xl hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.3)] transition-all">
          <div className="flex flex-col md:flex-row h-full">
            {image_url && (
              <div className="md:w-1/3 relative">
                <img 
                  src={image_url} 
                  alt={title} 
                  className="w-full h-full object-cover"
                />
                <div className="w-full text-xs p-1 bg-black bg-opacity-30 text-white absolute bottom-0 left-0">
                  Illustration by Levi Pritzker
                </div>
              </div>
            )}
            
            <div className={`p-4 ${image_url ? 'md:w-2/3' : 'w-full'} flex flex-col h-full`}>
              <h2 className={`${titleFontClass} text-3xl text-gray-900 mb-3`}>
                {title}
              </h2>
              
              {excerpt && (
                <p className="text-gray-600 text-lg mb-4 flex-grow">
                  {excerpt}
                </p>
              )}
              
              <div className="mt-auto w-full">
                {tags && tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {tags.map((tag, index) => (
                      <span 
                        key={index} 
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar size={14} className="mr-1" />
                  <span>{date}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default BlogCard;
