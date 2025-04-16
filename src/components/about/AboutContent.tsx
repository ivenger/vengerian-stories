
import React from "react";
import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AboutContentProps {
  content: string;
  imageUrl: string | null;
  isAdmin: boolean;
  user: any;
  authLoading: boolean;
}

const AboutContent: React.FC<AboutContentProps> = ({ 
  content, 
  imageUrl, 
  isAdmin, 
  user, 
  authLoading 
}) => {
  const formatContent = (text: string) => {
    if (!text) return "";
    let html = text.replace(/\n/g, "<br>");
    return html;
  };

  return (
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
  );
};

export default AboutContent;
