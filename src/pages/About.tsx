import React, { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchAboutContent } from "../services/aboutService";
import { Button } from "@/components/ui/button";
import MultilingualTitle from "@/components/MultilingualTitle";
import { useAuthContext } from "../components/AuthProvider";
import { Spinner } from "@/components/ui/spinner";
import Navigation from "../components/Navigation";

const About: React.FC = () => {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading, isAdmin } = useAuthContext();

  useEffect(() => {
    let isMounted = true;
    
    const loadAboutContent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log("About: Fetching about content...");
        
        const data = await fetchAboutContent();
        
        // Only update state if component is still mounted
        if (isMounted) {
          console.log("About: Content fetched successfully:", data);
          setContent(data.content || "");
          setImageUrl(data.image_url);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("About: Error loading about content:", error);
        
        // Only update state if component is still mounted
        if (isMounted) {
          setError("About content could not be loaded. Please try again later.");
          setContent("");
          setIsLoading(false);
        }
      }
    };

    loadAboutContent();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, []);

  const formatContent = (text: string) => {
    if (!text) return "";
    
    let html = text.replace(/\n/g, "<br>");
    return html;
  };

  return (
    <div>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <MultilingualTitle />
        
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-sm">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div>
              {!authLoading && user && isAdmin && (
                <div className="flex justify-end mb-4">
                  <Link to="/admin/about">
                    <Button 
                      variant="outline" 
                      className="flex items-center text-sm"
                    >
                      <Pencil size={14} className="mr-1" />
                      Edit About
                    </Button>
                  </Link>
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-6 items-start">
                {imageUrl && (
                  <div className="w-full md:w-1/3 flex-none mb-4 md:mb-0">
                    <img 
                      src={imageUrl} 
                      alt="About" 
                      className="w-full rounded-lg object-cover"
                    />
                  </div>
                )}
                
                <div className={`flex-grow ${imageUrl ? 'w-full md:w-2/3' : 'w-full'}`}>
                  <div 
                    dangerouslySetInnerHTML={{ __html: formatContent(content) }} 
                    className="prose max-w-none leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default About;
