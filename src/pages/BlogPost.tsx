
import React, { useState, useEffect, useCallback, useRef } from "react";
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

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const isMounted = React.useRef(true);
  const fetchInProgress = useRef(false);

  useEffect(() => {
    console.log(`[${new Date().toISOString()}] BlogPost: Component mounted`);
    isMounted.current = true;
    return () => {
      console.log(`[${new Date().toISOString()}] BlogPost: Component unmounted`);
      isMounted.current = false;
    };
  }, []);
  
  const fetchPostData = useCallback(async () => {
    if (!id) {
      console.log(`[${new Date().toISOString()}] BlogPost: No post ID found in URL parameters`);
      if (isMounted.current) {
        setError("Post ID is missing");
        setLoading(false);
      }
      return;
    }
    
    // Prevent duplicate fetches
    if (fetchInProgress.current) {
      console.log(`[${new Date().toISOString()}] BlogPost: Fetch already in progress, skipping`);
      return;
    }
    
    fetchInProgress.current = true;
    
    try {
      console.log(`[${new Date().toISOString()}] BlogPost: Fetching post with ID: ${id}`);
      if (isMounted.current) {
        setLoading(true);
        setError(null);
      }
      const postData = await fetchPostById(id);
      
      // Only update state if component is still mounted
      if (!isMounted.current) {
        fetchInProgress.current = false;
        return;
      }
      
      console.log(`[${new Date().toISOString()}] BlogPost: Successfully fetched post with title: ${postData?.title}`);
      
      // Check if we have a valid post with content
      if (!postData) {
        console.error(`[${new Date().toISOString()}] BlogPost: Post data is missing`);
        setError("The post could not be found.");
        setLoading(false);
        fetchInProgress.current = false;
        return;
      }
      
      if (!postData.content) {
        console.error(`[${new Date().toISOString()}] BlogPost: Post content is missing`);
        setError("The post content appears to be empty or missing.");
        setPost(postData); // Still set the post so we can show metadata
        setLoading(false);
        fetchInProgress.current = false;
        return;
      }
      
      setPost(postData);
      setLoading(false);
      
      // Mark post as read if user is logged in
      if (user && id) {
        try {
          console.log(`[${new Date().toISOString()}] BlogPost: Marking post ${id} as read for user ${user.id}`);
          await markPostAsRead(user.id, id);
        } catch (readErr) {
          console.error(`[${new Date().toISOString()}] BlogPost: Error marking post as read:`, readErr);
          // Don't show error to user as this is non-critical
        }
      }
    } catch (err: any) {
      console.error(`[${new Date().toISOString()}] BlogPost: Error fetching post:`, err);
      // Only update state if component is still mounted
      if (isMounted.current) {
        setError(err.message || "Failed to load the post. Please try again later.");
        setLoading(false);
        setPost(null);
      }
    } finally {
      fetchInProgress.current = false;
    }
  }, [id, navigate, user]);

  useEffect(() => {
    fetchPostData();
  }, [fetchPostData]);

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
