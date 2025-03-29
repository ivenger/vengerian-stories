
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Tag, Eye, Globe } from 'lucide-react';
import { BlogEntry } from '../types/blogTypes';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from './ui/badge';

interface BlogCardProps {
  post: BlogEntry;
}

const hasCyrillic = (text: string): boolean => {
  return /[А-Яа-яЁё]/.test(text);
};

const hasHebrew = (text: string): boolean => {
  return /[\u0590-\u05FF]/.test(text);
};

const getLanguageAbbreviation = (language: string): string => {
  const languageMap: Record<string, string> = {
    'English': 'en',
    'Hebrew': 'he',
    'Russian': 'ru'
  };
  
  return languageMap[language] || language.toLowerCase().substring(0, 2);
};

const BlogCard: React.FC<BlogCardProps> = ({ post }) => {
  const isRtl = hasHebrew(post.title);
  const hasCyrillicText = hasCyrillic(post.title);
  const { user } = useAuth();
  const [isRead, setIsRead] = useState(false);
  
  // Check if the post has been read by the user
  useEffect(() => {
    if (!user) return;
    
    const checkReadStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('reading_history')
          .select('*')
          .eq('user_id', user.id)
          .eq('post_id', post.id)
          .single();
          
        if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows returned"
          console.error("Error checking read status:", error);
          return;
        }
        
        setIsRead(!!data);
      } catch (err) {
        console.error("Error checking post read status:", err);
      }
    };
    
    checkReadStatus();
  }, [user, post.id]);

  // Determine layout direction based on language
  const isHebrewPost = post.language?.includes('Hebrew');
  const contentDirection = isRtl ? 'flex-row-reverse' : 'flex-row';
  const textAlignment = isRtl ? 'text-right' : 'text-left';
  const justifyContent = isRtl ? 'justify-end' : 'justify-start';

  return (
    <Link to={`/blog/${post.id}`} className="block no-underline">
      <div className="bg-white rounded-lg shadow-md overflow-hidden relative transition-all hover:shadow-lg">
        {/* Read indicator for logged in users */}
        {user && (
          <div className={`absolute top-3 ${isRtl ? 'left-3' : 'right-3'} ${isRead ? 'text-green-500' : 'text-gray-200'}`}>
            <Eye size={18} />
          </div>
        )}
        
        <div className="p-5">
          <div className={`flex flex-col md:${contentDirection} gap-4`}>
            {post.image_url && (
              <img 
                src={post.image_url} 
                alt={post.title}
                className="w-full md:w-32 h-32 object-cover rounded-md"
              />
            )}
            
            <div className={`flex-1 ${textAlignment}`}>
              <h2 
                className={`
                  block text-xl mb-2 hover:text-blue-600 transition-colors
                  ${isRtl ? 'font-raleway font-semibold' : hasCyrillicText ? 'font-pacifico' : 'font-pacifico'}
                `}
                dir={isRtl ? 'rtl' : 'ltr'}
              >
                {post.title}
              </h2>
              
              <div className={`flex items-center text-gray-500 text-sm mb-3 ${justifyContent}`}>
                <Calendar className={`h-4 w-4 ${isRtl ? 'ml-1' : 'mr-1'}`} />
                <span>{post.date}</span>
              </div>
              
              <div className={`flex flex-wrap gap-1 mt-2 ${justifyContent}`}>
                {/* Language badges */}
                {post.language && post.language.map((lang, index) => (
                  <Badge 
                    key={`lang-${index}`}
                    variant="secondary"
                    className="flex items-center px-2 py-1 text-xs"
                  >
                    <Globe className={`h-3 w-3 ${isRtl ? 'ml-1' : 'mr-1'}`} />
                    {getLanguageAbbreviation(lang)}
                  </Badge>
                ))}
                
                {/* Post tags */}
                {post.tags && post.tags.length > 0 && (
                  post.tags.map((tag, index) => (
                    <span 
                      key={`tag-${index}`}
                      className="flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Tag className={`h-3 w-3 ${isRtl ? 'ml-1' : 'mr-1'}`} />
                      {tag}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default BlogCard;
