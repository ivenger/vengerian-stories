
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, Clock, AlertCircle, BookOpen, Eye, EyeOff } from "lucide-react";
import { BlogEntry } from "../types/blogTypes";

interface ReadingHistoryItem {
  id: string;
  user_id: string;
  post_id: string;
  read_at: string;
}

const ReadingHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [allPosts, setAllPosts] = useState<BlogEntry[]>([]);
  const [readPosts, setReadPosts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all published blog posts
        const { data: posts, error: postsError } = await supabase
          .from("entries")
          .select("*")
          .eq("status", "published")
          .order("created_at", { ascending: false });
          
        if (postsError) throw postsError;
        
        // Fetch reading history
        const { data: history, error: historyError } = await supabase
          .from("reading_history")
          .select("*")
          .eq("user_id", user.id);
          
        if (historyError) throw historyError;
        
        setAllPosts(posts || []);
        setReadPosts((history as ReadingHistoryItem[] || []).map(item => item.post_id));
      } catch (err: any) {
        console.error("Error fetching reading data:", err);
        setError(err.message || "Failed to load reading history");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  // Filter posts based on read/unread toggle
  const filteredPosts = showUnreadOnly 
    ? allPosts.filter(post => !readPosts.includes(post.id))
    : allPosts;

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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Your Reading History</h3>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="show-unread" 
            checked={showUnreadOnly}
            onCheckedChange={setShowUnreadOnly}
          />
          <Label htmlFor="show-unread">Show unread only</Label>
        </div>
      </div>
      
      {filteredPosts.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          {showUnreadOnly ? (
            <div>
              <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-gray-600">You've read all available stories!</p>
            </div>
          ) : (
            <div>
              <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-gray-600">Your reading history will appear here.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPosts.map(post => (
            <Card key={post.id} className="overflow-hidden relative">
              <div className={`absolute top-3 right-3 ${readPosts.includes(post.id) ? 'text-green-500' : 'text-gray-300'}`}>
                {readPosts.includes(post.id) ? (
                  <Eye size={18} />
                ) : (
                  <EyeOff size={18} />
                )}
              </div>
              
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <Link 
                    to={`/blog/${post.id}`} 
                    className="text-md font-medium hover:text-blue-600 transition-colors mb-2"
                  >
                    {post.title}
                  </Link>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    {post.date}
                  </div>
                  
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {post.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center mt-3">
                    <Badge 
                      variant="outline" 
                      className={readPosts.includes(post.id) 
                        ? "bg-green-50 text-green-700 border-green-200" 
                        : "bg-gray-50 text-gray-500"
                      }
                    >
                      {readPosts.includes(post.id) ? "Read" : "Unread"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReadingHistory;
