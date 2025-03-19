import React from 'react';
import { Link } from 'react-router-dom';
import { BlogEntry } from '@/types/blogTypes';
import { Calendar } from 'lucide-react';

// Function to detect if text has Cyrillic characters
const hasCyrillic = (text: string): boolean => {
  return /[А-Яа-яЁё]/.test(text);
};

// Function to detect if text has Hebrew characters
const hasHebrew = (text: string): boolean => {
  return /[\u0590-\u05FF]/.test(text);
};

// Function to format date properly for RTL languages
const formatDateForRTL = (date: string): string => {
  // If the date contains numbers and is in a format like "Month DD, YYYY"
  if (/\d/.test(date)) {
    // Split into parts (assuming format like "Month DD, YYYY")
    const parts = date.split(/,\s*/);
    if (parts.length > 1) {
      // Keep the month and day part
      let monthDay = parts[0];
      // Reverse the year part (if it's 4 digits)
      let year = parts[1].trim();
      return `${monthDay}, ${year}`;
    }
  }
  return date;
};

interface BlogCardProps {
  post: BlogEntry;
}

const BlogCard: React.FC<BlogCardProps> = ({ post }) => {
  const { id, title, date, excerpt, image_url, tags } = post;
  
  // Determine the appropriate font class based on the content
  const titleFontClass = hasCyrillic(title) ? 'font-cursive-cyrillic' : 'font-caraterre';
  
  // Determine text direction based on language
  const isRtlTitle = hasHebrew(title);
  const isRtlExcerpt = excerpt ? hasHebrew(excerpt) : false;
  
  // Format date for RTL display if needed
  const displayDate = isRtlTitle ? formatDateForRTL(date) : date;
  
  return (
    <div className="flex justify-center w-full">
      <Link to={`/blog/${id}`} className="block w-full group">
        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-[4px_8px_16px_4px_rgba(0,0,0,0.2)] hover:shadow-[8px_16px_24px_6px_rgba(0,0,0,0.3)] transition-all">
          <div className="flex flex-col md:flex-row h-full">
            {image_url && (
              <div className="md:w-1/3 relative">
                <img 
                  src={image_url} 
                  alt={title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 text-xs p-1 text-gray-700 bg-white bg-opacity-75">
                  Illustration by Levi Pritzker
                </div>
              </div>
            )}
            
            <div className={`p-4 ${image_url ? 'md:w-2/3' : 'w-full'} flex flex-col h-full`}>
              <h2 
                className={`${titleFontClass} text-4xl text-gray-900 mb-3 ${isRtlTitle ? 'text-right' : 'text-left'}`}
                dir={isRtlTitle ? 'rtl' : 'ltr'}
              >
                {title}
              </h2>
              
              {excerpt && (
                <p 
                  className={`text-gray-600 text-lg mb-4 flex-grow ${isRtlExcerpt ? 'text-right' : 'text-left'}`}
                  dir={isRtlExcerpt ? 'rtl' : 'ltr'}
                >
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
                
                <div className={`flex items-center text-sm text-gray-500 ${isRtlTitle ? 'justify-end' : 'justify-start'}`}>
                  <Calendar size={14} className={isRtlTitle ? 'ml-1' : 'mr-1'} />
                  <span dir={isRtlTitle ? 'rtl' : 'ltr'}>
                    {displayDate}
                  </span>
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
