
import React, { useEffect, useRef } from "react";
import Navigation from "../components/Navigation";
import MultilingualTitle from "../components/MultilingualTitle";
import StoriesList from "../components/StoriesList";
import TagFilter from "../components/TagFilter";
import { useStoryFilters } from "../hooks/posts/useStoryFilters";

const Index = () => {
  const {
    posts,
    loading,
    error,
    loadPosts,
    readPostIds,
    selectedTags,
    handleTagSelect,
    clearTags
  } = useStoryFilters();
  
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    console.log("Index component mounted");
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  console.log("Index rendering with posts:", posts?.length);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 text-center">
          <MultilingualTitle />
          <div className="flex items-center justify-center gap-2">
            <p className="text-gray-600">
              Короткое, длиннее и странное
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <TagFilter 
            selectedTags={selectedTags} 
            onSelectTag={handleTagSelect}
            onClearTags={clearTags}
          />
          
          <StoriesList 
            posts={posts} 
            loading={loading} 
            error={error ? error.message : null}
            onRetry={() => {
              if (isMountedRef.current) {
                loadPosts(true);
              }
            }}
            readPostIds={readPostIds}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
