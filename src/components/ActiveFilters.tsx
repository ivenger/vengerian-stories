
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
    <div className="flex flex-wrap gap-2 justify-center mt-3 mb-2 bg-blue-50 p-2 rounded-md">
      <div className="flex items-center flex-wrap gap-1">
        <span className="text-sm text-blue-700 mr-2 font-medium">Active filters:</span>
        {selectedTags.map(tag => (
          <span 
            key={tag} 
            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center mr-1"
          >
            {tag}
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleTag(tag);
              }} 
              className="ml-1 text-blue-600 hover:text-blue-800 p-0.5"
              aria-label={`Remove ${tag} filter`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 px-2 text-xs text-blue-700 hover:bg-blue-100 hover:text-blue-900"
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
