import React, { useEffect, useRef } from "react";
import Navigation from "../components/Navigation";
import MultilingualTitle from "../components/MultilingualTitle";
import StoriesList from "../components/StoriesList";
import { useStoryFilters } from "../hooks/posts/useStoryFilters";

const Index = () => {
  const {
    posts,
    loading,
    error,
    loadPosts
  } = useStoryFilters();
  
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
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
            onRetry={() => {
              if (isMountedRef.current) {
                loadPosts(true);
              }
            }}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
