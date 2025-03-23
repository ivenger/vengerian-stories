
import React, { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchAboutContent } from "../services/blogService";
import { Button } from "@/components/ui/button";
import MultilingualTitle from "@/components/MultilingualTitle";
import { useAuth } from "../components/AuthProvider";

const About: React.FC = () => {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const loadAboutContent = async () => {
      try {
        setIsLoading(true);
        const data = await fetchAboutContent();
        
        if (typeof data === 'string') {
          setContent(data);
        } else {
          setContent(data.content || "");
          setImageUrl(data.image_url);
        }
      } catch (error) {
        console.error("Error loading about content:", error);
        setContent("About content could not be loaded. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    loadAboutContent();
  }, []);

  const formatContent = (text: string) => {
    if (!text) return "";
    
    let html = text.replace(/\n/g, "<br>");
    return html;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <MultilingualTitle />
      
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-sm">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div>
            {!authLoading && user && (
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
  );
};

export default About;
