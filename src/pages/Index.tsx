
// Import useState and the readingHistoryService
import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import Navigation from "@/components/Navigation";
import StoriesList from "@/components/StoriesList";
import { useStoryFilters } from "@/hooks/useStoryFilters";
import Footer from "@/components/Footer";
import ActiveFilters from "@/components/ActiveFilters";
import FilterDialog from "@/components/FilterDialog";
import { readingHistoryService } from "@/services/blogService";

const Index = () => {
  const { user } = useAuth();
  const storyFilters = useStoryFilters(user);  // Pass user as required argument
  const [showFilters, setShowFilters] = useState(false);

  const toggleFiltersDialog = () => {
    setShowFilters(!showFilters);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <ActiveFilters 
            hasActiveFilters={storyFilters.hasActiveFilters}
            selectedTags={storyFilters.selectedTags} 
            onToggleTag={storyFilters.toggleTag}
            showUnreadOnly={storyFilters.showUnreadOnly}
            onToggleUnreadFilter={storyFilters.toggleUnreadFilter}
            onClearFilters={storyFilters.clearFilters}
            onOpenFiltersDialog={toggleFiltersDialog}
          />
          
          <FilterDialog 
            isOpen={showFilters}
            onClose={() => setShowFilters(false)}
            allTags={storyFilters.allTags}
            selectedTags={storyFilters.selectedTags}
            onToggleTag={storyFilters.toggleTag}
            showUnreadOnly={storyFilters.showUnreadOnly}
            onToggleUnreadFilter={storyFilters.toggleUnreadFilter}
            onClearFilters={storyFilters.clearFilters}
          />
        </div>
        
        <StoriesList 
          posts={storyFilters.posts} 
          loading={storyFilters.loading} 
          error={storyFilters.error} 
          onReload={() => storyFilters.loadPosts(true)} 
        />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
