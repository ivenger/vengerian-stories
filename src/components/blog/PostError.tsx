
import React from "react";
import { Button } from "@/components/ui/button";
import PostHeader from "./PostHeader";

interface PostErrorProps {
  error: string | null;
}

const PostError: React.FC<PostErrorProps> = ({ error }) => {
  return (
    <div className="bg-red-50 p-8 rounded-lg text-center">
      <h2 className="text-2xl font-semibold text-red-800 mb-4">
        {error || "Post not found"}
      </h2>
      <Button 
        onClick={() => window.location.reload()} 
        variant="outline"
        className="mt-4"
      >
        Try Again
      </Button>
      <PostHeader title="" date="" />
    </div>
  );
};

export default PostError;
