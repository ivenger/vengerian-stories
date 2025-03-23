
import React from 'react';

interface MultilingualTitleProps {
  className?: string;
}

const MultilingualTitle: React.FC<MultilingualTitleProps> = ({ className = '' }) => {
  return (
    <div className="w-full flex justify-center py-4">
      <h1 
        className={`font-cursive-cyrillic text-6xl font-normal tracking-tight text-center ${className}`}
      >
        Vengerian Stories
      </h1>
    </div>
  );
};

export default MultilingualTitle;
