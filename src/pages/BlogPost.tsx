
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import { fetchPostById } from "../services/blogService";
import { BlogEntry } from "../types/blogTypes";
import { useToast } from "@/components/ui/use-toast";
import { Tag } from "lucide-react";

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loadPost = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const fetchedPost = await fetchPostById(id);
        
        if (fetchedPost) {
          setPost(fetchedPost);
        } else {
          navigate("/not-found");
        }
      } catch (error) {
        console.error("Failed to load post:", error);
        toast({
          title: "Error",
          description: "Failed to load the blog post. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [id, navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-12">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-4">Post Not Found</h1>
            <Link to="/" className="text-blue-600 hover:text-blue-800">
              ← Back to Home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-12">
        <article className="max-w-3xl mx-auto">
          <Link to="/" className="inline-block mb-8 text-gray-600 hover:text-gray-900">
            ← Back to all stories
          </Link>
          
          {post.image_url && (
            <div className="mb-8">
              <img 
                src={post.image_url} 
                alt={post.title} 
                className="w-full h-auto rounded-lg shadow-md"
              />
            </div>
          )}
          
          <h1 className="text-4xl font-cursive mb-4">{post.title}</h1>
          
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <span>{post.date}</span>
            <span className="mx-2">•</span>
            <span>{post.language.join(", ")}</span>
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map(tag => (
                <span key={tag} className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-xs">
                  <Tag size={12} className="mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content ? post.content.replace(/\n/g, '<br />') : '' }}
          />
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;
