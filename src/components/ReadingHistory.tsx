import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { BlogEntry } from '@/types/blogTypes';
import { Spinner } from './ui/spinner';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { format } from 'date-fns';

interface ReadingHistoryEntry {
  id: string;
  post_id: string;
  read_at: string;
}

const ReadingHistory = () => {
  const [history, setHistory] = useState<(BlogEntry & { read_at: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { user } = useAuth();

  const validateSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { data, error } = await supabase.auth.refreshSession();
        if (error || !data.session) {
          throw new Error("Session expired");
        }
      }
      return true;
    } catch (err) {
      console.error("Session validation failed:", err);
      return false;
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    let retryTimeout: NodeJS.Timeout;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Validate session before proceeding
        const isValid = await validateSession();
        if (!isValid) {
          throw new Error("Session expired");
        }
        
        // Fetch all published blog posts with explicit columns
        const { data: posts, error: postsError } = await supabase
          .from("entries")
          .select("id, title, title_language, content, excerpt, date, language, status, image_url, created_at, updated_at, translations, tags")
          .eq("status", "published")
          .order("created_at", { ascending: false });
          
        if (postsError) throw postsError;
        
        // Fetch reading history with explicit column selection
        const { data: history, error: historyError } = await supabase
          .from("reading_history")
          .select("id, user_id, post_id, read_at")
          .eq("user_id", user.id);
          
        if (historyError) throw historyError;
        
        if (!isMounted) return;

        // Match posts with reading history
        const readPosts = posts
          .filter(post => history?.some(h => h.post_id === post.id))
          .map(post => ({
            ...post,
            read_at: history?.find(h => h.post_id === post.id)?.read_at || ''
          }))
          .sort((a, b) => new Date(b.read_at).getTime() - new Date(a.read_at).getTime());

        setHistory(readPosts);
        setRetryCount(0); // Reset retry count on success
        
      } catch (error: any) {
        console.error("Error fetching reading history:", error);
        
        if (!isMounted) return;

        if (error.message === "Session expired") {
          setError("Your session has expired. Please refresh the page to continue.");
        } else if (retryCount < 3) {
          // Implement exponential backoff for retries
          const delay = Math.min(1000 * Math.pow(2, retryCount) + Math.random() * 1000, 10000);
          console.log(`ReadingHistory: Retrying in ${delay}ms (attempt ${retryCount + 1})`);
          
          setRetryCount(prev => prev + 1);
          retryTimeout = setTimeout(() => {
            if (isMounted) {
              fetchData();
            }
          }, delay);
        } else {
          setError("Failed to load reading history. Please try again later.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [user, retryCount, validateSession]);

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Not Authenticated</AlertTitle>
        <AlertDescription>Please sign in to view your reading history.</AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (history.length === 0) {
    return (
      <Alert>
        <AlertTitle>No Reading History</AlertTitle>
        <AlertDescription>You haven't read any stories yet.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Reading History</h2>
      <div className="grid gap-4">
        {history.map(post => (
          <div key={post.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <Link to={`/post/${post.id}`} className="block">
              <h3 className="text-lg font-semibold">{post.title}</h3>
              <p className="text-sm text-gray-500">
                Read on {format(new Date(post.read_at), 'PPP')}
              </p>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReadingHistory;
