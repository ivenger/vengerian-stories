
import React from "react";
import { Globe, FileText } from "lucide-react";

interface PostStatusProps {
  status: string;
}

const PostStatus = ({ status }: PostStatusProps) => {
  const getStatusColor = (status: string) => {
    return status === "published" 
      ? "bg-green-100 text-green-800" 
      : "bg-amber-100 text-amber-800";
  };

  const getStatusIcon = (status: string) => {
    return status === "published" 
      ? <Globe size={16} className="text-green-700" /> 
      : <FileText size={16} className="text-amber-700" />;
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(status)}`}>
      {getStatusIcon(status)}
      {status}
    </span>
  );
};

export default PostStatus;
