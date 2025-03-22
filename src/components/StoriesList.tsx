
import React from 'react';
import BlogCard from './BlogCard';
import { BlogEntry } from '../types/blogTypes';
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface StoriesListProps {
  posts: BlogEntry[];
  loading: boolean;
  hasActiveFilters: boolean;
  clearFilters: () => void;
  error?: string | null;
}

const StoriesList: React.FC<StoriesListProps> = ({ 
  posts, 
  loading, 
  hasActiveFilters,
  clearFilters,
  error
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }
  
  if (posts.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-600">
          {hasActiveFilters 
            ? "No stories found with the current selection. Try different options or clear them." 
            : "No stories found. Check back later for new content."}
        </p>
        {hasActiveFilters && (
          <Button 
            onClick={clearFilters} 
            className="mt-4"
            variant="outline"
          >
            Clear Selection
          </Button>
        )}
      </div>
    );
  }
  
  return (
    <div className="grid gap-8">
      {posts.map(post => <BlogCard key={post.id} post={post} />)}
    </div>
  );
};

export default StoriesList;
