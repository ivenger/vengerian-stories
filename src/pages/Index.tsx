
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import BlogCard from "../components/BlogCard";
import { blogPosts } from "../data/blogPosts";

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <main className="container mx-auto px-4">
        <header className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Minimal Writing</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Thoughts, stories, and ideas - expressed with clarity and simplicity.
          </p>
        </header>
        
        <section className="max-w-2xl mx-auto">
          {blogPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
