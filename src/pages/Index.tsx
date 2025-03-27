
import React from "react";
import Navigation from "../components/Navigation";
import MultilingualTitle from "../components/MultilingualTitle";
import StoriesList from "../components/StoriesList";
import { useStoryFilters } from "../hooks/useStoryFilters";

const Index = () => {
  // Use our custom hook to handle post loading
  const {
    posts,
    loading,
    error,
    loadPosts
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
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <StoriesList 
            posts={posts} 
            loading={loading} 
            error={error}
            onRetry={loadPosts}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
