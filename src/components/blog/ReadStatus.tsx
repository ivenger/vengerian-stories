
import React from "react";

interface ReadStatusProps {
  isRead: boolean;
}

const ReadStatus: React.FC<ReadStatusProps> = ({ isRead }) => {
  // This component is no longer needed without authentication, but still accepts props
  return null;
};

export default ReadStatus;
