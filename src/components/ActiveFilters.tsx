
import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActiveFiltersProps {
  selectedTags: string[];
  toggleTag: (tag: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  selectedTags,
  toggleTag,
  clearFilters,
  hasActiveFilters
}) => {
  if (!hasActiveFilters) return null;
  
  return (
    <div className="flex flex-wrap gap-2 justify-center mt-2">
      <div className="flex items-center flex-wrap">
        <span className="text-sm text-gray-500 mr-2">Viewing:</span>
        {selectedTags.map(tag => (
          <span 
            key={tag} 
            className="px-2 py-0.5 bg-gray-400 text-white text-xs rounded-full flex items-center mr-1"
          >
            {tag}
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleTag(tag);
              }} 
              className="ml-1 text-white hover:text-gray-200"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <Button 
          variant="ghost" 
          size="sm" 
          className="ml-2 h-6 px-2 text-xs"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            clearFilters();
          }}
        >
          Clear All
        </Button>
      </div>
    </div>
  );
};

export default ActiveFilters;
