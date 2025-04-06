
import React from "react";
import { Eye } from "lucide-react";

interface ReadStatusProps {
  isRead: boolean;
}

const ReadStatus = ({ isRead }: ReadStatusProps) => {
  return (
    <div className="absolute top-4 right-4">
      <div className="flex items-center bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
        <Eye className={`h-4 w-4 mr-1 ${isRead ? 'text-green-500' : 'text-gray-400'}`} />
        <span className="text-sm font-medium">
          {isRead ? 'Read' : 'Unread'}
        </span>
      </div>
    </div>
  );
};

export default ReadStatus;
