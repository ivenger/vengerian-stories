
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
    <div className="flex justify-center">
      <Link to={`/blog/${id}`} className="block w-full group">
        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-lg transition-all hover:shadow-xl">
          <div className="flex flex-col md:flex-row">
            {image_url && (
              <div className="md:w-1/3 h-full">
                <div className="relative">
                  <img 
                    src={image_url} 
                    alt={title} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 right-0 bg-black bg-opacity-30 text-white text-xs p-1">
                    Illustration by Levi Pritzker
                  </div>
                </div>
              </div>
            )}
            
            <div className={`p-4 ${image_url ? 'md:w-2/3' : 'w-full'} flex flex-col h-full`}>
              <h2 className={`${titleFontClass} text-2xl text-gray-900 mb-3`}>
                {title}
              </h2>
              
              {excerpt && (
                <p className="text-gray-600 text-lg mb-4 flex-grow">
                  {excerpt}
                </p>
              )}
              
              <div className="mt-auto">
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
