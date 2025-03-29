
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchPostById } from "../services/postService";
import Navigation from "../components/Navigation";
import { BlogEntry } from "../types/blogTypes";
import { useAuth } from "../components/AuthProvider";
import { useReadingTracker } from "@/components/blog/useReadingTracker";
import PostContent from "@/components/blog/PostContent";
import PostError from "@/components/blog/PostError";
import PostLoading from "@/components/blog/PostLoading";

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, refreshSession } = useAuth();
  const { isRead } = useReadingTracker(id, user);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: number;
    
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
        
        // Set a timeout to detect potential stalled requests
        timeoutId = window.setTimeout(() => {
          if (isMounted && loading && !fetchAttempted) {
            console.log("BlogPost: Post fetch taking too long, attempting session refresh");
            refreshSession();
          }
        }, 10000); // 10 seconds timeout
        
        const postData = await fetchPostById(id);
        setFetchAttempted(true);
        
        // Clear timeout since response was received
        window.clearTimeout(timeoutId);
        
        // Only update state if component is still mounted
        if (isMounted) {
          console.log(`BlogPost: Successfully fetched post with title: ${postData?.title}`);
          setPost(postData);
          setLoading(false);
        }
      } catch (err) {
        console.error("BlogPost: Error fetching post:", err);
        setFetchAttempted(true);
        
        // Clear timeout since response was received (with error)
        window.clearTimeout(timeoutId);
        
        // Only update state if component is still mounted
        if (isMounted) {
          setError("Failed to load the post. Please try again later.");
          setLoading(false);
          setPost(null);
        }
      }
    };

    fetchPostData();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [id, refreshSession]);

  return (
    <div>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <PostLoading />
        ) : error || !post ? (
          <PostError error={error} />
        ) : (
          <PostContent post={post} isUserLoggedIn={!!user} isRead={isRead} />
        )}
      </div>
    </div>
  );
};

export default BlogPost;
