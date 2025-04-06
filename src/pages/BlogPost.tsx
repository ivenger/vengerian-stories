
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchPostById } from "../services/postService";
import Navigation from "../components/Navigation";
import { BlogEntry } from "../types/blogTypes";
import PostContent from "@/components/blog/PostContent";
import PostError from "@/components/blog/PostError";
import PostLoading from "@/components/blog/PostLoading";
import { useReadingTracker } from "@/components/blog/useReadingTracker";

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isRead } = useReadingTracker(id);
  const [fetchAttempted, setFetchAttempted] = useState(false);

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

  useEffect(() => {
    console.log("BlogPost: Post fetch effect triggered");
    let isMounted = true;
    
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
    
    fetchWithTimeout();
    
    return () => {
      isMounted = false;
      console.log("BlogPost: Cleaning up fetch effect");
    };
  }, [id, fetchPostData]);

  return (
    <div>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <PostLoading />
        ) : error || !post ? (
          <PostError error={error} />
        ) : (
          <PostContent post={post} isUserLoggedIn={false} isRead={isRead} />
        )}
      </div>
    </div>
  );
};

export default BlogPost;
