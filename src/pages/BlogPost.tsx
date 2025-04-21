
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchPostById } from "../services/blogService";
import Navigation from "../components/Navigation";
import { BlogEntry } from "../types/blogTypes";
import { useAuth } from "@/hooks/auth/useAuth";
import PostContent from "@/components/blog/PostContent";
import PostError from "@/components/blog/PostError";
import PostLoading from "@/components/blog/PostLoading";
import { useToast } from "@/hooks/use-toast";
import { markPostAsRead } from "@/services/readingHistoryService";
import { supabase } from "@/integrations/supabase/client";

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const isMounted = React.useRef(true);
  const hasTriedMarkingAsRead = React.useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Check if session needs refresh
  useEffect(() => {
    if (user) {
      const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log(`[${new Date().toISOString()}] BlogPost: No active session, attempting refresh`);
          await supabase.auth.refreshSession();
        }
      };
      
      checkSession();
    }
  }, [user]);
  
  useEffect(() => {
    const fetchPostData = async () => {
      if (!id) {
        console.log(`[${new Date().toISOString()}] BlogPost: No post ID found in URL parameters`);
        if (isMounted.current) {
          setError("Post ID is missing");
          setLoading(false);
        }
        return;
      }
      
      try {
        console.log(`[${new Date().toISOString()}] BlogPost: Fetching post with ID: ${id}`);
        if (isMounted.current) {
          setLoading(true);
          setError(null);
        }
        const postData = await fetchPostById(id);
        
        // Only update state if component is still mounted
        if (!isMounted.current) return;
        
        console.log(`[${new Date().toISOString()}] BlogPost: Successfully fetched post with title: ${postData?.title}`);
        
        // Check if we have a valid post with content
        if (!postData) {
          console.error(`[${new Date().toISOString()}] BlogPost: Post data is missing`);
          setError("The post could not be found.");
          setLoading(false);
          return;
        }
        
        if (!postData.content) {
          console.error(`[${new Date().toISOString()}] BlogPost: Post content is missing`);
          setError("The post content appears to be empty or missing.");
          setPost(postData); // Still set the post so we can show metadata
          setLoading(false);
          return;
        }
        
        setPost(postData);
        setLoading(false);
        
        // Mark post as read if user is logged in - delay slightly to ensure auth is ready
        if (user && id && !hasTriedMarkingAsRead.current) {
          hasTriedMarkingAsRead.current = true;
          
          // Small delay to ensure session is properly established
          setTimeout(async () => {
            try {
              console.log(`[${new Date().toISOString()}] BlogPost: Marking post ${id} as read for user ${user.id}`);
              const success = await markPostAsRead(user.id, id);
              
              if (!success) {
                console.warn(`[${new Date().toISOString()}] BlogPost: Failed to mark post as read automatically`);
              }
            } catch (readErr) {
              console.error(`[${new Date().toISOString()}] BlogPost: Error marking post as read:`, readErr);
              // Don't show error to user as this is non-critical
            }
          }, 1000);
        }
      } catch (err: any) {
        console.error(`[${new Date().toISOString()}] BlogPost: Error fetching post:`, err);
        // Only update state if component is still mounted
        if (isMounted.current) {
          setError(err.message || "Failed to load the post. Please try again later.");
          setLoading(false);
          setPost(null);
        }
      }
    };

    fetchPostData();
  }, [id, navigate, user]);

  return (
    <div>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <PostLoading />
        ) : error || !post ? (
          <PostError error={error} />
        ) : (
          <PostContent 
            post={post} 
            isUserLoggedIn={!!user} 
            user={user}
            postId={id}
          />
        )}
      </div>
    </div>
  );
};

export default BlogPost;
