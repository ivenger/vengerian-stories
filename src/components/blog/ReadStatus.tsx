
import React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReadStatusProps {
  isRead: boolean;
  isUpdating?: boolean;
  onToggle?: () => void;
}

const ReadStatus = ({ isRead, isUpdating = false, onToggle }: ReadStatusProps) => {
  return (
    <div className="absolute top-4 right-4">
      <Button 
        variant="ghost" 
        size="sm"
        className="flex items-center bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm hover:bg-white/90"
        onClick={onToggle}
        disabled={isUpdating || !onToggle}
      >
        {isRead ? (
          <>
            <Eye className="h-4 w-4 mr-1 text-green-500" />
            <span className="text-sm font-medium">Read</span>
          </>
        ) : (
          <>
            <EyeOff className="h-4 w-4 mr-1 text-gray-400" />
            <span className="text-sm font-medium">Unread</span>
          </>
        )}
        {isUpdating && <span className="ml-1 h-2 w-2 bg-blue-500 rounded-full animate-pulse"></span>}
      </Button>
    </div>
  );
};

export default ReadStatus;
