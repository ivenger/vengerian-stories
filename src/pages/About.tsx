
import { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import { fetchAboutContent } from "../services/blogService";
import { useToast } from "@/hooks/use-toast";

// Function to detect if text has Hebrew characters
const hasHebrew = (text: string): boolean => {
  return /[\u0590-\u05FF]/.test(text);
};

const About = () => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        const aboutContent = await fetchAboutContent("Russian");
        setContent(aboutContent);
      } catch (error) {
        console.error("Failed to load about content:", error);
        toast({
          title: "Error",
          description: "Failed to load the about page content. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [toast]);

  // Determine if content has Hebrew characters to set text direction
  const isRtlContent = hasHebrew(content);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <main className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-caraterre mb-8">About Me</h1>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div 
              className={`prose prose-lg max-w-none ${isRtlContent ? 'text-right' : 'text-left'}`}
              dir={isRtlContent ? 'rtl' : 'ltr'}
            >
              {content.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default About;
