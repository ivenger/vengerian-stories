
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
              Welcome to my corner of the internet. I'm a writer, thinker, and observer of life's quiet moments.
            </p>
            
            <p>
              This blog is a space for reflection, exploration, and sharing ideas. I write about creativity, mindfulness, the writing process, and the beauty found in everyday experiences.
            </p>
            
            <p>
              My approach to writing is guided by simplicity and clarity. I believe that the most profound ideas can be expressed in plain language, and that writing should illuminate rather than obscure.
            </p>
            
            <p>
              When I'm not writing, you might find me walking in nature, reading books that challenge my thinking, or enjoying conversations with friends over coffee.
            </p>
            
            <p>
              Thank you for visiting. I hope you find something here that resonates with you.
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;
