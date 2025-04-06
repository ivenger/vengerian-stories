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
import { useSupabaseRequest } from "@/hooks/useSupabaseRequest";
import { useToast } from "@/hooks/use-toast";

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { isRead } = useReadingTracker(id, user);
  const { toast } = useToast();
  
  const {
    execute: fetchPost,
    loading,
    error,
    data: post
  } = useSupabaseRequest<BlogEntry>(
    () => {
      if (!id) {
        throw new Error("Post ID is missing");
      }
      return fetchPostById(id);
    },
    {
      onError: (error) => {
        toast({
          title: "Error",
          description: error?.message || "Failed to load the post. Please try again later.",
          variant: "destructive"
        });
      }
    }
  );

  useEffect(() => {
    if (id) {
      fetchPost();
    }
  }, [id, fetchPost]);

  return (
    <div>
      <Navigation />
      
      {loading ? (
        <PostLoading />
      ) : error ? (
        <PostError error={error} />
      ) : post ? (
        <PostContent post={post} isRead={isRead} />
      ) : null}
    </div>
  );
}

export default BlogPost;
