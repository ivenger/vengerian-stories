
import { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import { fetchAboutContent } from "../services/blogService";
import { useToast } from "@/hooks/use-toast";
import MultilingualTitle from "../components/MultilingualTitle";
import { Button } from "@/components/ui/button";

// Function to detect if text has Hebrew characters
const hasHebrew = (text: string): boolean => {
  return /[\u0590-\u05FF]/.test(text);
};

const About = () => {
  const [content, setContent] = useState("");
  const [authorImage, setAuthorImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const aboutData = await fetchAboutContent("Russian");
      
      if (typeof aboutData === 'string') {
        setContent(aboutData);
      } else {
        setContent(aboutData.content || "");
        setAuthorImage(aboutData.image_url || null);
      }
    } catch (error: any) {
      console.error("Failed to load about content:", error);
      setError(error?.message || "Failed to load the about page content.");
      toast({
        title: "Error",
        description: "Failed to load the about page content. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  // Determine if content has Hebrew characters to set text direction
  const isRtlContent = hasHebrew(content);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <main className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <MultilingualTitle className="mb-8" />
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-red-50 rounded-lg border border-red-100">
              <div className="h-12 w-12 text-red-500 mx-auto mb-3">⚠️</div>
              <p className="text-gray-700 mb-4">{error}</p>
              <Button 
                onClick={loadContent} 
                variant="outline"
                className="border-red-300 hover:bg-red-50"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {authorImage && (
                <div className="mb-6">
                  <div className="overflow-hidden border border-gray-200 shadow-md relative">
                    <img 
                      src={authorImage} 
                      alt="Author" 
                      className="w-full h-auto object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 text-xs p-1 text-gray-700 bg-white bg-opacity-75">
                      Illustration by Levi Pritzker
                    </div>
                  </div>
                </div>
              )}
              
              <div 
                className={`prose prose-lg max-w-none ${isRtlContent ? 'text-right' : 'text-left'}`}
                dir={isRtlContent ? 'rtl' : 'ltr'}
              >
                {content ? content.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                )) : (
                  <p className="text-gray-600 text-center italic">No content available.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default About;
