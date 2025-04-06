
import React from 'react';
import BlogCard from './BlogCard';
import { BlogEntry } from '../types/blogTypes';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

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
  const isRetrying = error?.includes('Retrying');

  if (error) {
    return (
      <div className="text-center py-12 bg-red-50 rounded-lg border border-red-100">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <p className="text-gray-700 mb-4">{error}</p>
        <div className="flex justify-center gap-3">
          <Button 
            onClick={onRetry} 
            variant="outline"
            className="border-red-300 hover:bg-red-50 flex items-center gap-2"
            disabled={isRetrying}
          >
            {isRetrying ? (
              <>
                <Spinner size="sm" />
                <span>Retrying...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </>
            )}
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
    console.log("StoriesList is in loading state");
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-500 mt-4">Loading stories...</span>
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
          <Button 
            onClick={clearFilters} 
            variant="outline"
            className="mt-4"
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
