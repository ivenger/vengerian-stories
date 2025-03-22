import { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import { fetchAboutContent } from "../services/blogService";
import { useToast } from "@/hooks/use-toast";
import MultilingualTitle from "../components/MultilingualTitle";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

const hasHebrew = (text: string): boolean => {
  return /[\u0590-\u05FF]/.test(text);
};

const About = () => {
  const [content, setContent] = useState("");
  const [authorImage, setAuthorImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
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
      } catch (error) {
        console.error("Failed to load about content:", error);
        setError("Failed to load the about page content");
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

  const isRtlContent = hasHebrew(content);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <main className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <MultilingualTitle className="mb-8" />
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={handleRetry} variant="outline">
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
                {content.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default About;
