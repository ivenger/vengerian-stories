
import React, { useCallback, useEffect } from "react";
import Navigation from "../components/Navigation";
import MultilingualTitle from "../components/MultilingualTitle";
import FilterDialog from "../components/FilterDialog";
import ActiveFilters from "../components/ActiveFilters";
import StoriesList from "../components/StoriesList";
import { useStoryFilters } from "../hooks/useStoryFilters";
import { useAuth } from "@/hooks/auth/useAuth";
import { useReadingHistory } from "@/hooks/filters/useReadingHistory";
import { Button } from "@/components/ui/button";
import { RefreshCw, WifiOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { user } = useAuth();
  const { readPostIds, refreshReadingHistory } = useReadingHistory(user);
  const { toast } = useToast();
  
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
    loadPosts,
    connectionStatus
  } = useStoryFilters(user);
  
  // Force reload posts when readPostIds changes
  useEffect(() => {
    if (showUnreadOnly && readPostIds) {
      loadPosts(true); // Force refresh when read history changes and unread filter is active
    }
  }, [readPostIds, showUnreadOnly, loadPosts]);
  
  // Callback for when reading status changes in a child component
  const handleReadStatusChange = useCallback(() => {
    console.log(`[${new Date().toISOString()}] Index: Reading status changed, refreshing data`);
    refreshReadingHistory(true); // Force refresh of reading history
  }, [refreshReadingHistory]);

  // Manual refresh function for users
  const handleManualRefresh = () => {
    console.log("Manual refresh requested by user");
    toast({
      title: "Refreshing stories...",
      duration: 2000,
    });
    loadPosts(true);
  };
  
  // Show connection status to user
  useEffect(() => {
    if (connectionStatus === 'error' && !loading) {
      toast({
        title: "Connection issue detected",
        description: "Having trouble accessing our servers. Some features may be limited.",
        duration: 5000,
        variant: "destructive",
      });
    }
  }, [connectionStatus, loading, toast]);
  
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
          {(error || connectionStatus === 'error') && (
            <div className="mb-4 flex justify-center">
              <Button 
                onClick={handleManualRefresh}
                className="flex items-center gap-2"
                variant="outline"
              >
                {connectionStatus === 'error' ? (
                  <WifiOff className="h-4 w-4" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh Stories
              </Button>
            </div>
          )}
          
          <StoriesList 
            posts={posts} 
            loading={loading} 
            error={error}
            hasActiveFilters={hasActiveFilters} 
            clearFilters={clearFilters}
            onRetry={handleManualRefresh}
            readPostIds={readPostIds}
            onReadStatusChange={handleReadStatusChange}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
