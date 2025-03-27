
import React from 'react';
import BlogCard from './BlogCard';
import { BlogEntry } from '../types/blogTypes';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface StoriesListProps {
  posts: BlogEntry[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const StoriesList: React.FC<StoriesListProps> = ({ 
  posts, 
  loading, 
  error,
  onRetry
}) => {
  if (error) {
    return (
      <div className="text-center py-12 bg-red-50 rounded-lg border border-red-100">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <p className="text-gray-700 mb-4">{error}</p>
        <Button 
          onClick={onRetry} 
          variant="outline"
          className="border-red-300 hover:bg-red-50"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (loading) {
    console.log("StoriesList is in loading state");
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-500">Loading stories...</span>
      </div>
    );
  }
  
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">
          No stories found. Check back later for new content.
        </p>
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
