
import React, { useContext } from "react";
import Navigation from "../components/Navigation";
import { Filter } from "lucide-react";
import { LanguageContext } from "../App";
import MultilingualTitle from "../components/MultilingualTitle";
import FilterDialog from "../components/FilterDialog";
import ActiveFilters from "../components/ActiveFilters";
import StoriesList from "../components/StoriesList";
import { useStoryFilters } from "../hooks/useStoryFilters";

const Index = () => {
  // Get language context
  const { currentLanguage } = useContext(LanguageContext);
  
  // Use our custom hook to handle all filter logic
  const {
    posts,
    loading,
    allTags,
    selectedTags,
    selectedLanguages,
    toggleTag,
    toggleLanguage,
    clearFilters,
    hasActiveFilters,
    languages
  } = useStoryFilters();
  
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
              selectedLanguages={selectedLanguages}
              toggleTag={toggleTag}
              toggleLanguage={toggleLanguage}
              clearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
              languages={languages}
            />
          </div>
          
          <ActiveFilters 
            selectedLanguages={selectedLanguages}
            selectedTags={selectedTags}
            toggleLanguage={toggleLanguage}
            toggleTag={toggleTag}
            clearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        <div className="max-w-3xl mx-auto">
          <StoriesList 
            posts={posts} 
            loading={loading} 
            hasActiveFilters={hasActiveFilters} 
            clearFilters={clearFilters} 
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
