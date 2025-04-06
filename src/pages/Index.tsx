
import React, { useState, useEffect, useCallback } from 'react';
import StoriesList from "../components/StoriesList";
import Navigation from "../components/Navigation";
import MultilingualTitle from "@/components/MultilingualTitle";
import useStoryFilters from "@/hooks/useStoryFilters";
import ActiveFilters from "@/components/ActiveFilters";
import FilterDialog from "@/components/FilterDialog";

const Index: React.FC = () => {
  const {
    posts: filteredPosts,
    allTags,
    selectedTags,
    showUnreadOnly,
    loading,
    error,
    hasActiveFilters,
    onToggleTag,
    onToggleUnreadFilter,
    onClearFilters,
    onReloadPosts,
    isFilterDialogOpen,
    setIsFilterDialogOpen,
    onOpenFiltersDialog
  } = useStoryFilters();

  const handleReloadPosts = useCallback(() => {
    onReloadPosts();
  }, [onReloadPosts]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <MultilingualTitle />
        
        {/* Filter UI */}
        <div className="mb-6">
          <ActiveFilters
            hasActiveFilters={hasActiveFilters}
            selectedTags={selectedTags}
            toggleTag={onToggleTag}
            showUnreadOnly={showUnreadOnly}
            toggleUnreadFilter={onToggleUnreadFilter}
            clearFilters={onClearFilters}
            openFiltersDialog={onOpenFiltersDialog}
          />
          
          <FilterDialog
            open={isFilterDialogOpen}
            onOpenChange={setIsFilterDialogOpen}
            allTags={allTags}
            selectedTags={selectedTags}
            toggleTag={onToggleTag}
            showUnreadOnly={showUnreadOnly}
            toggleUnreadFilter={onToggleUnreadFilter}
            clearFilters={onClearFilters}
          />
        </div>

        {/* Stories List */}
        <StoriesList 
          posts={filteredPosts} 
          loading={loading}
          error={error}
          reload={handleReloadPosts}
          hasActiveFilters={hasActiveFilters}
          clearFilters={onClearFilters}
        />
      </div>
    </div>
  );
};

export default Index;
