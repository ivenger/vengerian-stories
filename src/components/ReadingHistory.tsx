import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Clock, AlertCircle, BookOpen, Eye, EyeOff } from "lucide-react";
import { BlogEntry } from "../types/blogTypes";
import { useSessionRefresh } from "@/hooks/filters/useSessionRefresh";
import { shouldRetryRequest } from "@/hooks/filters/filterUtils";

const ReadingHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [allPosts, setAllPosts] = useState<BlogEntry[]>([]);
  const [readPosts, setReadPosts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { refreshSession } = useSessionRefresh();
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if we need to refresh the session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log("ReadingHistory: No active session found, refreshing...");
          await refreshSession();
        }
        
        // Fetch all published blog posts with explicit columns
        const { data: posts, error: postsError } = await supabase
          .from("entries")
          .select("id, title, title_language, content, excerpt, date, language, status, image_url, created_at, updated_at, translations, tags")
          .eq("status", "published")
          .order("created_at", { ascending: false });
          
        if (postsError) {
          // Check if we should retry due to auth/connection issues
          if (shouldRetryRequest(postsError) && retryCount < maxRetries) {
            console.log(`ReadingHistory: Retrying posts fetch (attempt ${retryCount + 1}/${maxRetries})`);
            setRetryCount(prev => prev + 1);
            await refreshSession();
            setTimeout(fetchData, 1000); // Retry after a short delay
            return;
          }
          throw postsError;
        }
        
        // Reset retry count on success
        setRetryCount(0);
        
        // Fetch reading history with explicit column selection
        const { data: history, error: historyError } = await supabase
          .from("reading_history")
          .select("id, user_id, post_id, read_at")
          .eq("user_id", user.id);
        
        if (historyError) {
          console.error("ReadingHistory: Error fetching reading history:", historyError);
          // Don't throw error for reading history issues, just continue with empty state
          setReadPosts([]);
        } else {
          setReadPosts((history || []).map(item => item.post_id));
        }

        // Map the posts to BlogEntry type
        const mappedPosts = (posts || []).map((post): BlogEntry => ({
          id: post.id,
          title: post.title,
          title_language: post.title_language || ['en'],
          content: post.content || '',
          excerpt: post.excerpt,
          date: post.date,
          language: post.language || ['English'],
          status: post.status || 'published',
          image_url: post.image_url,
          created_at: post.created_at,
          updated_at: post.updated_at,
          translations: post.translations || [],
          tags: post.tags || []
        }));
        
        setAllPosts(mappedPosts);
      } catch (err: any) {
        console.error("ReadingHistory: Error fetching reading data:", err);
        setError(err.message || "Failed to load reading history");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Also refresh data when the page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        console.log(`ReadingHistory: Page visible, refreshing data`);
        fetchData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, refreshSession]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6 bg-red-50 rounded-lg">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-700">{error}</p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.location.reload()}
          className="mt-3"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (allPosts.length === 0) {
    return (
      <div className="text-center py-6 bg-gray-50 rounded-lg">
        <BookOpen className="h-8 w-8 text-gray-500 mx-auto mb-2" />
        <p className="text-gray-600">No stories are available at the moment.</p>
      </div>
    );
  }

  // Separate posts into read and unread
  const readPostsList = allPosts.filter(post => readPosts.includes(post.id));
  const unreadPostsList = allPosts.filter(post => !readPosts.includes(post.id));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Your Reading Activity</h3>
        
        {/* Unread Posts Section */}
        <div className="mb-6">
          <h4 className="text-md font-medium mb-3 flex items-center">
            <EyeOff size={16} className="mr-2 text-gray-500" />
            Stories You Haven't Read Yet ({unreadPostsList.length})
          </h4>
          
          {unreadPostsList.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <Check className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <p className="text-gray-600">You're all caught up! You've read all available stories.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {unreadPostsList.slice(0, 5).map(post => (
                <Card key={post.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <Link 
                      to={`/blog/${post.id}`} 
                      className="text-md font-medium hover:text-blue-600 transition-colors"
                    >
                      {post.title}
                    </Link>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {post.tags && post.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {unreadPostsList.length > 5 && (
                <div className="text-center py-3">
                  <span className="text-sm text-gray-500">
                    + {unreadPostsList.length - 5} more unread stories
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Read Posts Section */}
        <div>
          <h4 className="text-md font-medium mb-3 flex items-center">
            <Eye size={16} className="mr-2 text-green-500" />
            Stories You've Read ({readPostsList.length})
          </h4>
          
          {readPostsList.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <Clock className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <p className="text-gray-600">You haven't read any stories yet. Start exploring!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {readPostsList.map(post => (
                <Card key={post.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <Link 
                      to={`/blog/${post.id}`} 
                      className="text-md font-medium hover:text-blue-600 transition-colors"
                    >
                      {post.title}
                    </Link>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {post.tags && post.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="mt-3">
                      <Badge 
                        variant="outline" 
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        Read
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReadingHistory;
