
import { useState } from "react";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import BlogCard from "../components/BlogCard";
import { blogPosts } from "../data/blogPosts";

const Index = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  
  const languages = ["English", "Russian", "Hebrew"];
  
  const filteredPosts = selectedLanguage 
    ? blogPosts.filter(post => post.language === selectedLanguage)
    : blogPosts;

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <main className="container mx-auto px-4">
        <header className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Minimal Writing</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Thoughts, stories, and ideas - expressed with clarity and simplicity.
          </p>
          
          <div className="flex justify-center space-x-4 mb-8">
            <button
              onClick={() => setSelectedLanguage(null)}
              className={`px-3 py-1 rounded-md transition-colors ${
                selectedLanguage === null 
                  ? "bg-gray-800 text-white" 
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              All
            </button>
            
            {languages.map(language => (
              <button
                key={language}
                onClick={() => setSelectedLanguage(language)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  selectedLanguage === language 
                    ? "bg-gray-800 text-white" 
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {language}
              </button>
            ))}
          </div>
        </header>
        
        <section className="max-w-2xl mx-auto">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))
          ) : (
            <p className="text-center text-gray-500">No posts available in this language.</p>
          )}
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
