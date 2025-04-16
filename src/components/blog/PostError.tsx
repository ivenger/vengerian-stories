
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { RefreshCw, Home } from "lucide-react";

interface PostErrorProps {
  error: string | null;
}

const PostError: React.FC<PostErrorProps> = ({ error }) => {
  return (
    <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-3xl mx-auto">
      <div className="text-red-500 mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        {error || "Post not found"}
      </h2>
      
      <p className="text-gray-600 mb-8">
        Sorry, we couldn't find the post you're looking for. It may have been removed or is temporarily unavailable.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Try Again
        </Button>
        
        <Link to="/">
          <Button variant="default" className="flex items-center gap-2">
            <Home size={16} />
            Back to Stories
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default PostError;
