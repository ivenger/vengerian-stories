
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Tag, Eye, EyeOff } from 'lucide-react';
import { BlogEntry } from '../types/blogTypes';
import { useAuth } from '@/hooks/auth/useAuth';
import { isPostRead, togglePostReadStatus } from '@/services/readingHistoryService';
import { useToast } from '@/hooks/use-toast';

interface BlogCardProps {
  post: BlogEntry;
  readPostIds?: string[];
  onReadStatusChange?: () => void;
}

const hasCyrillic = (text: string): boolean => {
  return /[А-Яа-яЁё]/.test(text);
};

const hasHebrew = (text: string): boolean => {
  return /[\u0590-\u05FF]/.test(text);
};

const BlogCard: React.FC<BlogCardProps> = ({ post, readPostIds, onReadStatusChange }) => {
  const isRtl = hasHebrew(post.title);
  const hasCyrillicText = hasCyrillic(post.title);
  const { user } = useAuth();
  const [isRead, setIsRead] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Check if post is in the provided readPostIds array (from parent component)
  useEffect(() => {
    if (readPostIds && post.id) {
      const isInReadList = readPostIds.includes(post.id);
      console.log(`[${new Date().toISOString()}] BlogCard: Post ${post.id} in read list?: ${isInReadList}`);
      setIsRead(isInReadList);
      setIsLoading(false);
    }
  }, [readPostIds, post.id]);
  
  // Fall back to direct check if readPostIds isn't provided
  useEffect(() => {
    if (!readPostIds && user && post.id) {
      const checkReadStatus = async () => {
        try {
          console.log(`[${new Date().toISOString()}] BlogCard: Checking read status for post ${post.id}`);
          setIsLoading(true);
          const readStatus = await isPostRead(user.id, post.id);
          console.log(`[${new Date().toISOString()}] BlogCard: Post ${post.id} read status: ${readStatus}`);
          setIsRead(readStatus);
        } catch (err) {
          console.error(`[${new Date().toISOString()}] BlogCard: Error checking post read status:`, err);
        } finally {
          setIsLoading(false);
        }
      };
      
      checkReadStatus();
    } else if (!user) {
      setIsLoading(false); // Not logged in, so no need to check
    }
  }, [user, post.id, readPostIds]);

  const handleToggleReadStatus = async (e: React.MouseEvent) => {
    if (!user || isLoading) return;
    
    // Stop the event from triggering navigation
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setIsLoading(true);
      const newReadStatus = !isRead;
      
      console.log(`[${new Date().toISOString()}] BlogCard: Toggling read status for ${post.id} to ${newReadStatus}`);
      const success = await togglePostReadStatus(user.id, post.id, newReadStatus);
      
      if (success) {
        setIsRead(newReadStatus);
        toast({
          title: newReadStatus ? "Marked as read" : "Marked as unread",
          description: newReadStatus 
            ? "This post has been added to your reading history" 
            : "This post has been removed from your reading history",
        });
        
        // Notify parent component that read status has changed
        if (onReadStatusChange) {
          console.log(`[${new Date().toISOString()}] BlogCard: Notifying parent of read status change`);
          onReadStatusChange();
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to update reading status",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(`[${new Date().toISOString()}] BlogCard: Error toggling read status:`, err);
      toast({
        title: "Error",
        description: "Failed to update reading status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isHebrewPost = post.language?.includes('Hebrew');
  const contentDirection = isHebrewPost ? 'flex-row-reverse' : 'flex-row';

  return (
    <Link to={`/blog/${post.id}`} className="block no-underline">
      <div className="bg-white rounded-lg shadow-md overflow-hidden relative transition-all hover:shadow-lg">
        {user && (
          <div 
            className={`absolute top-2 sm:top-3 right-2 sm:right-3 z-10 cursor-pointer p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition-colors ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
            onClick={handleToggleReadStatus}
          >
            {isRead ? (
              <Eye size={16} className="text-green-500 sm:h-[18px] sm:w-[18px]" />
            ) : (
              <EyeOff size={16} className="text-gray-300 sm:h-[18px] sm:w-[18px]" />
            )}
          </div>
        )}
        
        <div className="p-3 sm:p-5">
          <div className={`flex flex-col sm:${contentDirection} gap-3 sm:gap-4`}>
            {post.image_url && (
              <img 
                src={post.image_url} 
                alt={post.title}
                className="w-full sm:w-32 h-24 sm:h-32 object-cover rounded-md"
              />
            )}
            
            <div className={`flex-1 ${isRtl ? 'text-right' : 'text-left'}`}>
              <h2 
                className={`
                  block text-lg sm:text-xl mb-1.5 sm:mb-2 hover:text-blue-600 transition-colors
                  ${isRtl ? 'font-raleway font-semibold' : hasCyrillicText ? 'font-pacifico' : 'font-pacifico'}
                `}
                dir={isRtl ? 'rtl' : 'ltr'}
              >
                {post.title}
              </h2>
              
              <div className={`flex items-center text-gray-500 text-xs sm:text-sm mb-2 sm:mb-3 ${isRtl ? 'justify-end' : 'justify-start'}`}>
                <Calendar className={`h-3 w-3 sm:h-4 sm:w-4 ${isRtl ? 'ml-1' : 'mr-1'}`} />
                <span>{post.date}</span>
              </div>
              
              {post.tags && post.tags.length > 0 && (
                <div className={`flex flex-wrap gap-1 mt-2 ${isRtl ? 'justify-end' : 'justify-start'}`}>
                  {post.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] sm:text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Tag className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${isRtl ? 'ml-1' : 'mr-1'}`} />
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
