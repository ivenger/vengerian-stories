
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useTagData } from '@/hooks/tags/useTagData';
import { Skeleton } from './ui/skeleton';

interface TagFilterProps {
  selectedTags: string[];
  onSelectTag: (tag: string) => void;
  onClearTags: () => void;
}

const TagFilter: React.FC<TagFilterProps> = ({
  selectedTags,
  onSelectTag,
  onClearTags
}) => {
  const { tags, loading } = useTagData();
  const [isExpanded, setIsExpanded] = useState(false);

  // Reset expanded state when selected tags changes
  useEffect(() => {
    if (selectedTags.length === 0) {
      setIsExpanded(false);
    }
  }, [selectedTags]);

  if (loading) {
    return (
      <div className="mb-4">
        <Skeleton className="h-8 w-40 my-2" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-7 w-20" />
        </div>
      </div>
    );
  }

  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Filter by tags:</h3>
        {selectedTags.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-xs"
            onClick={onClearTags}
          >
            <X className="mr-1 h-3 w-3" />
            Clear filters
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {tags.slice(0, isExpanded ? tags.length : 6).map((tag) => (
          <Badge
            key={tag}
            variant={selectedTags.includes(tag) ? "default" : "outline"}
            className={`cursor-pointer ${
              selectedTags.includes(tag) 
                ? "bg-blue-500 hover:bg-blue-600" 
                : "hover:bg-gray-100"
            }`}
            onClick={() => onSelectTag(tag)}
          >
            {tag}
          </Badge>
        ))}
        
        {tags.length > 6 && !isExpanded && (
          <Button 
            variant="ghost" 
            size="sm"
            className="text-xs h-7 px-2"
            onClick={() => setIsExpanded(true)}
          >
            + {tags.length - 6} more
          </Button>
        )}
        
        {isExpanded && tags.length > 6 && (
          <Button 
            variant="ghost" 
            size="sm"
            className="text-xs h-7 px-2"
            onClick={() => setIsExpanded(false)}
          >
            Show less
          </Button>
        )}
      </div>
    </div>
  );
};

export default TagFilter;
