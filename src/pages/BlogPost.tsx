
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchPostById } from "../services/postService";
import Navigation from "../components/Navigation";
import { BlogEntry } from "../types/blogTypes";
import { useAuth } from "@/hooks/auth/useAuth"; // Updated import
import { useReadingTracker } from "@/components/blog/useReadingTracker";
import PostContent from "@/components/blog/PostContent";
import PostError from "@/components/blog/PostError";
import PostLoading from "@/components/blog/PostLoading";

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { isRead } = useReadingTracker(id, user);

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
          setPost(postData);
          setLoading(false);
        }
      } catch (err) {
        console.error("BlogPost: Error fetching post:", err);
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
    };
  }, [id]);

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
