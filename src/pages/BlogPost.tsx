
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import { blogPosts } from "../data/blogPosts";
import { Pencil } from "lucide-react";
import MarkdownEditor from "../components/MarkdownEditor";

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  
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

  const handleSaveEdit = (updatedPost) => {
    console.log("Post updated:", updatedPost);
    setIsEditing(false);
    // In a real application, we would update the blogPosts.ts file here
  };

  if (isEditing) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <MarkdownEditor 
            post={post} 
            onSave={handleSaveEdit}
            onCancel={() => setIsEditing(false)}
          />
        </main>
        <Footer />
      </div>
    );
  }

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
          
          <div className="mt-16 pt-8 border-t border-gray-200 flex justify-between items-center">
            <button 
              onClick={() => navigate("/")}
              className="text-gray-700 hover:text-black transition-colors"
            >
              ← Back to all posts
            </button>
            
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md transition-colors"
            >
              <Pencil size={16} />
              Edit post
            </button>
          </div>
        </article>
      </main>
      
      <Footer />
    </div>
  );
};

export default BlogPost;
