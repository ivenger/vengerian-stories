
import React, { useEffect } from "react";
import { Calendar, Tag } from "lucide-react";
import { BlogEntry } from "../../types/blogTypes";
import MarkdownPreview from "../MarkdownPreview";
import ReadStatus from "./ReadStatus";
import { useReadingTracker } from "./useReadingTracker";
import { User } from "@supabase/supabase-js";
import { useLocation } from "react-router-dom";

interface PostContentProps {
  post: BlogEntry;
  isUserLoggedIn: boolean;
  user: User | null;
  postId: string | undefined;
}

const PostContent: React.FC<PostContentProps> = ({ post, isUserLoggedIn, user, postId }) => {
  const location = useLocation();
  const isBlogPostPage = location.pathname.startsWith('/blog/');
  
  // Use the enhanced reading tracker, but only enable auto-marking on blog post pages
  const { isRead, isUpdating, toggleReadStatus } = useReadingTracker(postId, user);
  
  console.log(`[${new Date().toISOString()}] PostContent: Rendering with read status:`, {
    postId,
    isRead,
    isUpdating,
    isUserLoggedIn,
    isBlogPostPage,
    currentPath: location.pathname
  });

  // Ensure post has all required fields or provide defaults
  const safePost = {
    ...post,
    title: post.title || 'Untitled Post',
    content: post.content || '',
    date: post.date || '',
    language: post.language || ['English'],
    tags: post.tags || [],
  };

  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden relative max-w-4xl mx-auto">
      {isUserLoggedIn && isBlogPostPage && (
        <ReadStatus 
          isRead={isRead} 
          isUpdating={isUpdating}
          onToggle={toggleReadStatus} 
        />
      )}

      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">{safePost.title}</h1>

        <div className="flex flex-wrap items-center text-gray-500 mb-6 gap-4">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{safePost.date}</span>
          </div>

          {safePost.tags && safePost.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {safePost.tags.map((tag, index) => (
                <span
                  key={index}
                  className="flex items-center text-xs px-2 py-1 bg-gray-100 rounded-full"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="prose max-w-none">
          {safePost.content ? (
            <MarkdownPreview 
              title="" /* Pass empty title to avoid duplication */
              date={safePost.date}
              language={safePost.language?.[0] || 'English'}
              content={safePost.content}
              tags={safePost.tags || []}
              imageUrl={safePost.image_url || null}
            />
          ) : (
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <p className="text-gray-500">The content for this post is not available.</p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default PostContent;
