
import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface PostHeaderProps {
  title: string;
  date: string;
  tags?: string[];
  imageUrl?: string | null;
}

const PostHeader = ({ title, date, tags = [], imageUrl }: PostHeaderProps) => {
  return (
    <>
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Stories
        </Link>
      </div>

      {/* We don't render the title here to avoid duplication, it's now only in PostContent */}
      
      {imageUrl && (
        <div className="w-full h-64 sm:h-80 md:h-96 bg-gray-100">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </>
  );
};

export default PostHeader;
