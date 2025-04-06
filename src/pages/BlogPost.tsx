
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchPostById } from "../services/postService";
import MarkdownPreview from "../components/MarkdownPreview";
import Navigation from "../components/Navigation";
import { BlogEntry } from "../types/blogTypes";
import { useAuth } from "../components/AuthProvider";
import { Tag, Calendar } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import PostHeader from "@/components/blog/PostHeader";
import ReadStatus from "@/components/blog/ReadStatus";
import { useReadingTracker } from "@/components/blog/useReadingTracker";

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

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading post...</p>
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
            <PostHeader title="" date="" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <PostHeader 
          title={post.title} 
          date={post.date} 
          tags={post.tags}
          imageUrl={post.image_url}
        />

        <article className="bg-white rounded-lg shadow-md overflow-hidden relative max-w-4xl mx-auto">
          {user && <ReadStatus isRead={isRead} />}

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
