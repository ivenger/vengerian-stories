
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Tag, Eye, EyeOff } from 'lucide-react';
import { BlogEntry } from '../types/blogTypes';
import { useAuth } from '@/hooks/auth/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface BlogCardProps {
  post: BlogEntry;
}

const hasCyrillic = (text: string): boolean => {
  return /[А-Яа-яЁё]/.test(text);
};

const hasHebrew = (text: string): boolean => {
  return /[\u0590-\u05FF]/.test(text);
};

const BlogCard: React.FC<BlogCardProps> = ({ post }) => {
  const isRtl = hasHebrew(post.title);
  const hasCyrillicText = hasCyrillic(post.title);
  const { user } = useAuth();
  const [isRead, setIsRead] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!user || !post.id) {
      setIsLoading(false);
      return;
    }
    
    const checkReadStatus = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('reading_history')
          .select('*')
          .eq('user_id', user.id)
          .eq('post_id', post.id)
          .maybeSingle();
          
        if (error) {
          console.error("BlogCard: Error checking read status:", error);
        } else {
          setIsRead(!!data);
        }
      } catch (err) {
        console.error("Error checking post read status:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkReadStatus();
  }, [user, post.id]);

  const isHebrewPost = post.language?.includes('Hebrew');
  const contentDirection = isHebrewPost ? 'flex-row-reverse' : 'flex-row';

  return (
    <Link to={`/blog/${post.id}`} className="block no-underline">
      <div className="bg-white rounded-lg shadow-md overflow-hidden relative transition-all hover:shadow-lg">
        {user && (
          <div className={`absolute top-3 right-3 ${isLoading ? 'opacity-50' : ''}`}>
            {isRead ? (
              <Eye size={18} className="text-green-500" />
            ) : (
              <EyeOff size={18} className="text-gray-300" />
            )}
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
            
            <div className={`flex-1 ${isRtl ? 'text-right' : 'text-left'}`}>
              <h2 
                className={`
                  block text-xl mb-2 hover:text-blue-600 transition-colors
                  ${isRtl ? 'font-raleway font-semibold' : hasCyrillicText ? 'font-pacifico' : 'font-pacifico'}
                `}
                dir={isRtl ? 'rtl' : 'ltr'}
              >
                {post.title}
              </h2>
              
              <div className={`flex items-center text-gray-500 text-sm mb-3 ${isRtl ? 'justify-end' : 'justify-start'}`}>
                <Calendar className={`h-4 w-4 ${isRtl ? 'ml-1' : 'mr-1'}`} />
                <span>{post.date}</span>
              </div>
              
              {post.tags && post.tags.length > 0 && (
                <div className={`flex flex-wrap gap-1 mt-2 ${isRtl ? 'justify-end' : 'justify-start'}`}>
                  {post.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Tag className={`h-3 w-3 ${isRtl ? 'ml-1' : 'mr-1'}`} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default BlogCard;
