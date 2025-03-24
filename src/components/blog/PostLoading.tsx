
import React from "react";
import { Spinner } from "@/components/ui/spinner";

const PostLoading: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Spinner size="lg" />
      <p className="mt-4 text-gray-600">Loading post...</p>
    </div>
  );
};

export default PostLoading;
