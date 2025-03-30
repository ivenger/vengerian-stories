
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, refreshSession } = useAuth();
  const { isRead } = useReadingTracker(id, user);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  // Use useCallback to prevent recreating this function on every render
  const fetchPostData = useCallback(async () => {
    if (!id) {
      console.log("BlogPost: No post ID found in URL parameters");
      setError("Post ID is missing");
      setLoading(false);
      return;
    }
    
    try {
      console.log(`BlogPost: Fetching post with ID: ${id}`);
      setLoading(true);
      setError(null);
      
      const postData = await fetchPostById(id);
      setFetchAttempted(true);
      
      if (!postData) {
        console.log(`BlogPost: Post with ID ${id} not found`);
        setError("Post not found");
        setPost(null);
      } else {
        console.log(`BlogPost: Successfully fetched post with title: ${postData.title}`);
        setPost(postData);
      }
    } catch (err) {
      console.error("BlogPost: Error fetching post:", err);
      setFetchAttempted(true);
      setError("Failed to load the post. Please try again later.");
      setPost(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch post when component mounts or ID changes
  useEffect(() => {
    console.log("BlogPost: Post fetch effect triggered");
    let isMounted = true;
    let timeoutId: number;
    
    const fetchWithTimeout = async () => {
      try {
        await fetchPostData();
      } catch (err) {
        if (isMounted) {
          console.error("BlogPost: Unhandled error in fetch effect:", err);
          setError("An unexpected error occurred. Please try again.");
          setLoading(false);
        }
      }
    };
    
    // Set a timeout to detect potential stalled requests
    timeoutId = window.setTimeout(() => {
      if (isMounted && loading && !fetchAttempted) {
        console.log("BlogPost: Post fetch taking too long, attempting session refresh");
        refreshSession().then(() => {
          if (isMounted) {
            fetchWithTimeout();
          }
        });
      }
    }, 10000); // 10 seconds timeout
    
    fetchWithTimeout();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
      console.log("BlogPost: Cleaning up fetch effect");
    };
  }, [id, refreshSession, fetchPostData]); // Added fetchPostData to dependencies

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
