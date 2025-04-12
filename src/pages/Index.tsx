
import React from "react";
import Navigation from "../components/Navigation";
import MultilingualTitle from "../components/MultilingualTitle";
import FilterDialog from "../components/FilterDialog";
import ActiveFilters from "../components/ActiveFilters";
import StoriesList from "../components/StoriesList";
import { useStoryFilters } from "../hooks/useStoryFilters";
import { useAuth } from "../components/AuthProvider";

const Index = () => {
  const { user } = useAuth();
  
  // Pass the user to the useStoryFilters hook
  const {
    posts,
    loading,
    error,
    allTags,
    selectedTags,
    showUnreadOnly,
    toggleTag,
    toggleUnreadFilter,
    clearFilters,
    hasActiveFilters,
    loadPosts
  } = useStoryFilters(user);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 text-center relative">
          <MultilingualTitle />
          <div className="flex items-center justify-center gap-2">
            <p className="text-gray-600">
              Короткое, длиннее и странное
            </p>
            
            <FilterDialog 
              allTags={allTags}
              selectedTags={selectedTags}
              toggleTag={toggleTag}
              clearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
              showUnreadOnly={showUnreadOnly}
              toggleUnreadFilter={toggleUnreadFilter}
            />
          </div>
          
          <ActiveFilters 
            selectedTags={selectedTags}
            toggleTag={toggleTag}
            clearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        <div className="max-w-3xl mx-auto">
          <StoriesList 
            posts={posts} 
            loading={loading} 
            error={error}
            hasActiveFilters={hasActiveFilters} 
            clearFilters={clearFilters}
            onRetry={loadPosts}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
