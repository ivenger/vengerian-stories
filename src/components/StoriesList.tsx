import React, { useState, useEffect } from 'react';
import BlogCard from './BlogCard';
import { BlogEntry } from '@/types/blogTypes';
import { useStoryFilters } from '@/hooks/useStoryFilters';
import { useAuth } from './AuthProvider';
import ActiveFilters from './ActiveFilters';
import FilterDialog from './FilterDialog';
import { Filter } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Spinner } from './ui/spinner';
import { useSupabaseRequest } from '@/hooks/useSupabaseRequest';
import { fetchFilteredPosts } from '@/services/postService';
import { useToast } from '@/hooks/use-toast';

const StoriesList: React.FC = () => {
  const {
    allTags,
    selectedTags,
    showUnreadOnly,
    toggleTag,
    toggleUnreadFilter,
    clearFilters,
    hasActiveFilters
  } = useStoryFilters();
  const { user } = useAuth();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { toast } = useToast();

  const {
    execute: fetchPosts,
    loading,
    error,
    data: posts,
    reset: resetPosts
  } = useSupabaseRequest<BlogEntry[]>(
    () => fetchFilteredPosts(selectedTags),
    {
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to load stories. Please try again.",
          variant: "destructive"
        });
      }
    }
  );

  useEffect(() => {
    console.log("StoriesList: Component mounted");
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    console.log("StoriesList: Filters changed, refreshing posts");
    fetchPosts();
  }, [selectedTags, showUnreadOnly, fetchPosts]);

  const handleClearFilters = () => {
    clearFilters();
    resetPosts();
    fetchPosts();
  };

  if (loading && !posts) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const filteredPosts = showUnreadOnly && user
    ? posts?.filter(post => !post.readBy?.includes(user.id))
    : posts;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Stories</h1>
        <Button
          variant="outline"
          onClick={() => setIsFilterOpen(true)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filter Stories
        </Button>
      </div>

      {hasActiveFilters && (
        <ActiveFilters
          selectedTags={selectedTags}
          showUnreadOnly={showUnreadOnly}
          onClearAll={handleClearFilters}
          onRemoveTag={(tag) => toggleTag(tag)}
          onToggleUnread={() => toggleUnreadFilter()}
        />
      )}

      <FilterDialog
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        selectedTags={selectedTags}
        allTags={allTags}
        showUnreadOnly={showUnreadOnly}
        onTagToggle={toggleTag}
        onUnreadToggle={toggleUnreadFilter}
        onClearAll={handleClearFilters}
        isUserLoggedIn={!!user}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPosts?.map((post) => (
          <BlogCard
            key={post.id}
            post={post}
            isRead={user ? post.readBy?.includes(user.id) : false}
          />
        ))}
      </div>

      {filteredPosts?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No stories found matching your criteria.</p>
          {hasActiveFilters && (
            <Button
              variant="link"
              onClick={handleClearFilters}
              className="mt-2"
            >
              Clear all filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default StoriesList;
