
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchPostById } from "../services/blogService";
import MarkdownPreview from "../components/MarkdownPreview";
import Navigation from "../components/Navigation";
import { BlogEntry } from "../types/blogTypes";
import { useAuth } from "../components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Tag, Calendar, Eye } from "lucide-react";

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRead, setIsRead] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPostData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        const postData = await fetchPostById(id);
        setPost(postData);
        
        // Check if post is already marked as read
        if (user) {
          const { data, error } = await supabase
            .from('reading_history')
            .select('*')
            .eq('user_id', user.id)
            .eq('post_id', id)
            .single();
            
          if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows returned"
            console.error("Error checking read status:", error);
          } else {
            setIsRead(!!data);
          }
        }
      } catch (err) {
        console.error("Error fetching post:", err);
        setError("Failed to load the post. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPostData();
  }, [id, user]);

  // Mark post as read when it loads
  useEffect(() => {
    const markAsRead = async () => {
      if (!user || !post || isRead) return;
      
      try {
        // Insert into reading history
        const { error } = await supabase
          .from('reading_history')
          .upsert({ 
            user_id: user.id, 
            post_id: post.id,
            read_at: new Date().toISOString()
          }, { 
            onConflict: 'user_id,post_id' 
          });
          
        if (error) {
          console.error("Error marking post as read:", error);
          return;
        }
        
        setIsRead(true);
      } catch (err) {
        console.error("Error in markAsRead:", err);
      }
    };
    
    // Only try to mark as read if the post has fully loaded
    if (post && !loading) {
      markAsRead();
    }
  }, [post, user, loading, isRead]);

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div>
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="bg-red-50 p-8 rounded-lg text-center">
            <h2 className="text-2xl font-semibold text-red-800 mb-4">
              {error || "Post not found"}
            </h2>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Stories
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Stories
          </Link>
        </div>

        <article className="bg-white rounded-lg shadow-md overflow-hidden relative max-w-4xl mx-auto">
          {user && (
            <div className="absolute top-4 right-4">
              <div className="flex items-center bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                <Eye className={`h-4 w-4 mr-1 ${isRead ? 'text-green-500' : 'text-gray-400'}`} />
                <span className="text-sm font-medium">
                  {isRead ? 'Read' : 'Unread'}
                </span>
              </div>
            </div>
          )}

          {post.image_url && (
            <div className="w-full h-64 sm:h-80 md:h-96 bg-gray-100">
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

            <div className="flex flex-wrap items-center text-gray-500 mb-6 gap-4">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{post.date}</span>
              </div>

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, index) => (
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
              <MarkdownPreview 
                title={post.title}
                date={post.date}
                language={post.language?.[0] || 'English'}
                content={post.content}
                tags={post.tags || []}
                imageUrl={post.image_url || null}
              />
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};

export default BlogPost;

