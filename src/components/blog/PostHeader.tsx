
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
      <div className="mb-4 sm:mb-8 px-4 sm:px-0">
        <Link
          to="/"
          className="inline-flex items-center text-sm sm:text-base text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
          Back to Stories
        </Link>
      </div>

      {imageUrl && (
        <div className="w-full h-48 sm:h-64 md:h-80 lg:h-96 bg-gray-100">
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
