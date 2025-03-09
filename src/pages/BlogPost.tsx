
import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import { blogPosts } from "../data/blogPosts";

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const post = blogPosts.find(post => post.id === id);
  
  useEffect(() => {
    if (!post) {
      navigate("/404");
    }
    
    // Scroll to top when post loads
    window.scrollTo(0, 0);
  }, [post, navigate]);
  
  if (!post) return null;

  // Find related posts in other languages
  const relatedPosts = post.translations ? 
    blogPosts.filter(p => post.translations && post.translations.includes(p.id)) : 
    [];

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <main className="container mx-auto px-4">
        <article className="max-w-2xl mx-auto">
          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <span>{post.date}</span>
              <span className="mx-2">•</span>
              <span>{post.language}</span>
            </div>
            
            {relatedPosts.length > 0 && (
              <div className="text-sm text-gray-500">
                Also available in:{" "}
                {relatedPosts.map((p, index) => (
                  <span key={p.id}>
                    <Link 
                      to={`/blog/${p.id}`}
                      className="text-gray-700 hover:text-black underline"
                    >
                      {p.language}
                    </Link>
                    {index < relatedPosts.length - 1 && ", "}
                  </span>
                ))}
              </div>
            )}
          </header>
          
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          
          <div className="mt-16 pt-8 border-t border-gray-200">
            <button 
              onClick={() => navigate("/")}
              className="text-gray-700 hover:text-black transition-colors"
            >
              ← Back to all posts
            </button>
          </div>
        </article>
      </main>
      
      <Footer />
    </div>
  );
};

export default BlogPost;
