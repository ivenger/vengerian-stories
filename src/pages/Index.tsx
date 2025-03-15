import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import BlogCard from "../components/BlogCard";
import Footer from "../components/Footer";
import Navigation from "../components/Navigation";
import { fetchPublishedPosts } from "../services/blogService";
import { BlogEntry } from "../types/blogTypes";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [posts, setPosts] = useState<BlogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const publishedPosts = await fetchPublishedPosts();
      setPosts(publishedPosts);
    } catch (error) {
      console.error("Failed to load posts:", error);
      toast({
        title: "Error",
        description: "Failed to load blog posts. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handlePostUpdated = (updatedPost: BlogEntry) => {
    if (updatedPost.status === "published") {
      loadPosts();
    } else {
      setPosts(prevPosts => 
        prevPosts.map(p => p.id === updatedPost.id ? updatedPost : p)
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-cursive font-bold text-gray-900 mb-3">
            Vengerian Stories
          </h1>
          <p className="text-gray-600 max-w-lg mx-auto">
            Welcome to our collection of wonderful stories. Explore the magic of storytelling.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No stories found. Check back later for new content.</p>
          </div>
        ) : (
          <div className="grid gap-8">
            {posts.map((post) => (
              <BlogCard 
                key={post.id} 
                post={post} 
                onPostUpdated={handlePostUpdated}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
