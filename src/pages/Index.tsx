
import React, { useEffect, useRef, useState } from "react";
import Navigation from "../components/Navigation";
import MultilingualTitle from "../components/MultilingualTitle";
import StoriesList from "../components/StoriesList";
import { useStoryFilters } from "../hooks/posts/useStoryFilters";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const {
    posts,
    loading,
    error,
    loadPosts,
    readPostIds
  } = useStoryFilters();
  
  const { toast } = useToast();
  const isMountedRef = useRef(true);
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    console.log("Index component mounted");
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  const handleRefresh = async () => {
    if (refreshing) return;
    
    try {
      setRefreshing(true);
      console.log("Manual refresh triggered");
      await loadPosts(true);
      toast({
        title: "Refreshed",
        description: "Stories have been refreshed",
      });
    } catch (err) {
      console.error("Error during manual refresh:", err);
      toast({
        title: "Refresh failed",
        description: "Could not refresh stories. Please try again.",
        variant: "destructive"
      });
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false);
      }
    }
  };
  
  console.log("Index rendering with posts:", posts?.length);
  
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
          <div className="absolute right-0 top-0">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={handleRefresh}
              disabled={loading || refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
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
            readPostIds={readPostIds}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
