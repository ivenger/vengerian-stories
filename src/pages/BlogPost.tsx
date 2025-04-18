
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchPostById } from "../services/blogService";
import Navigation from "../components/Navigation";
import { BlogEntry } from "../types/blogTypes";
import { useAuth } from "@/hooks/auth/useAuth";
import { useReadingTracker } from "@/components/blog/useReadingTracker";
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
  const { isRead, toggleReadStatus, isUpdating } = useReadingTracker(id, user);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    
    const fetchPostData = async () => {
      if (!id) {
        console.log("BlogPost: No post ID found in URL parameters");
        if (isMounted) {
          setError("Post ID is missing");
          setLoading(false);
        }
        return;
      }
      
      try {
        console.log(`BlogPost: Fetching post with ID: ${id}`);
        setLoading(true);
        setError(null);
        const postData = await fetchPostById(id);
        
        // Only update state if component is still mounted
        if (isMounted) {
          console.log(`BlogPost: Successfully fetched post with title: ${postData?.title}`);
          
          // Check if we have a valid post with content
          if (!postData) {
            console.error("BlogPost: Post data is missing");
            setError("The post could not be found.");
            setLoading(false);
            return;
          }
          
          if (!postData.content) {
            console.error("BlogPost: Post content is missing");
            setError("The post content appears to be empty or missing.");
            setPost(postData); // Still set the post so we can show metadata
            setLoading(false);
            return;
          }
          
          setPost(postData);
          setLoading(false);
          
          // Mark post as read if user is logged in
          if (user && id) {
            try {
              console.log(`BlogPost: Marking post ${id} as read for user ${user.id}`);
              await markPostAsRead(user.id, id);
            } catch (readErr) {
              console.error("BlogPost: Error marking post as read:", readErr);
              // Don't show error to user as this is non-critical
            }
          }
        }
      } catch (err: any) {
        console.error("BlogPost: Error fetching post:", err);
        // Only update state if component is still mounted
        if (isMounted) {
          setError(err.message || "Failed to load the post. Please try again later.");
          setLoading(false);
          setPost(null);
        }
      }
    };

    fetchPostData();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
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
            isRead={isRead} 
            user={user}
            postId={id}
          />
        )}
      </div>
    </div>
  );
};

export default BlogPost;
