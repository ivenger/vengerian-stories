
import React from 'react';
import BlogCard from './BlogCard';
import { BlogEntry } from '../types/blogTypes';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StoriesListProps {
  posts: BlogEntry[];
  loading: boolean;
  error?: string | null;
  hasActiveFilters: boolean;
  clearFilters: () => void;
  onRetry?: () => void;
}

const StoriesList: React.FC<StoriesListProps> = ({ 
  posts, 
  loading, 
  error,
  hasActiveFilters,
  clearFilters,
  onRetry
}) => {
  if (error) {
    return (
      <div className="text-center py-12 bg-red-50 rounded-lg border border-red-100">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <p className="text-gray-700 mb-4">{error}</p>
        <div className="flex justify-center gap-3">
          <Button 
            onClick={onRetry} 
            variant="outline"
            className="border-red-300 hover:bg-red-50"
          >
            Try Again
          </Button>
          {hasActiveFilters && (
            <Button 
              onClick={clearFilters}
              variant="outline" 
              className="border-gray-300"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">
          {hasActiveFilters 
            ? "No stories found with the current selection. Try different options or clear them." 
            : "No stories found. Check back later for new content."}
        </p>
        {hasActiveFilters && (
          <button 
            onClick={clearFilters} 
            className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Clear Selection
          </button>
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
