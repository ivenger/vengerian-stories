
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchPostById } from '../services/blogService';
import { BlogEntry } from '../types/blogTypes';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Calendar, Tag } from 'lucide-react';

// Function to detect if text has Cyrillic characters
const hasCyrillic = (text: string): boolean => {
  return /[А-Яа-яЁё]/.test(text);
};

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPost = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const postData = await fetchPostById(id);
        setPost(postData);
      } catch (err) {
        console.error('Error loading post:', err);
        setError('Failed to load the blog post. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPost();
  }, [id]);

  // Format the content with basic HTML when in preview mode
  const getFormattedContent = (content: string) => {
    // This is a very basic markdown-to-html conversion
    let formatted = content
      .replace(/# (.*)/g, '<h1>$1</h1>')
      .replace(/## (.*)/g, '<h2>$1</h2>')
      .replace(/### (.*)/g, '<h3>$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');

    // Convert URL-like text to actual links
    formatted = formatted.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>'
    );

    return formatted;
  };

  // Determine the appropriate font class based on the content
  const titleFontClass = post && hasCyrillic(post.title) ? 'font-cursive-cyrillic' : 'font-cursive';

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-red-600 mb-4">Error</h2>
            <p className="text-gray-600">{error}</p>
            <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">
              Return to Home
            </Link>
          </div>
        ) : post ? (
          <article className="max-w-3xl mx-auto">
            <Link 
              to="/" 
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
            >
              ← Back to all posts
            </Link>
            
            <h1 className={`${titleFontClass} text-4xl mb-4`}>
              {post.title}
            </h1>
            
            <div className="flex items-center text-gray-500 mb-6">
              <Calendar size={16} className="mr-1" />
              <span>{post.date}</span>
            </div>
            
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    <Tag size={14} className="mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: getFormattedContent(post.content) }}
            />
            
            {post.image_url && (
              <div className="mt-8">
                <img 
                  src={post.image_url} 
                  alt={post.title} 
                  className="w-full max-h-96 object-cover rounded-lg"
                />
              </div>
            )}
          </article>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">Post Not Found</h2>
            <p className="text-gray-600">The blog post you're looking for doesn't exist or has been removed.</p>
            <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">
              Return to Home
            </Link>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default BlogPost;
