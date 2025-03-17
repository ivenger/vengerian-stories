
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";

const About = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <main className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">About Me</h1>
          
          <div className="prose prose-lg max-w-none">
            <p>
              Обо мне.
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;
