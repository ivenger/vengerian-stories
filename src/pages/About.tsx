
import React, { useState, useEffect, useRef } from "react";
import { Pencil, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchAboutContent } from "../services/aboutService";
import { Button } from "@/components/ui/button";
import MultilingualTitle from "@/components/MultilingualTitle";
import { useAuth } from "../components/AuthProvider";
import { Spinner } from "@/components/ui/spinner";
import Navigation from "../components/Navigation";
import { useToast } from "@/hooks/use-toast";

const About: React.FC = () => {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading, isAdmin } = useAuth();
  const { toast } = useToast();
  const isMountedRef = useRef(true);
  const fetchAttempts = useRef(0);
  const maxRetries = 3;
  const fetchControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Set mounted flag
    isMountedRef.current = true;
    
    // Reset loading state on component mount
    setIsLoading(true);
    setError(null);
    
    const loadAboutContent = async () => {
      // If there's an existing fetch, abort it
      if (fetchControllerRef.current) {
        console.log("About: Aborting previous fetch");
        fetchControllerRef.current.abort();
      }
      
      // Create a new AbortController for this fetch
      fetchControllerRef.current = new AbortController();
      
      try {
        if (fetchAttempts.current > 0) {
          console.log(`About: Retry attempt ${fetchAttempts.current} of ${maxRetries}`);
        } else {
          console.log("About: Fetching about content...");
        }
        
        const data = await fetchAboutContent(fetchControllerRef.current.signal);
        
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          console.log("About: Content fetched successfully:", data);
          setContent(data.content || "");
          setImageUrl(data.image_url);
          setIsLoading(false);
          setError(null);
          // Reset retry counter on success
          fetchAttempts.current = 0;
        }
      } catch (error: any) {
        console.error("About: Error loading about content:", error);
        
        // Don't update state if aborted or component unmounted
        if (error.name === 'AbortError') {
          console.log("About: Fetch aborted");
          return;
        }
        
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          if (fetchAttempts.current < maxRetries) {
            // Retry with exponential backoff
            const retryDelay = Math.min(1000 * Math.pow(2, fetchAttempts.current), 5000);
            fetchAttempts.current += 1;
            
            console.log(`About: Retrying in ${retryDelay}ms (attempt ${fetchAttempts.current}/${maxRetries})`);
            setError(`Loading failed. Retrying in ${Math.round(retryDelay/1000)} seconds...`);
            
            setTimeout(() => {
              if (isMountedRef.current) {
                loadAboutContent();
              }
            }, retryDelay);
          } else {
            // Max retries reached
            setError("Content could not be loaded. Please try again later.");
            setIsLoading(false);
            
            // Show toast for user feedback
            toast({
              title: "Loading Error",
              description: "Failed to load about content after multiple attempts.",
              variant: "destructive"
            });
          }
        }
      } finally {
        // Clear the controller reference if this is the current fetch
        if (isMountedRef.current && fetchControllerRef.current) {
          fetchControllerRef.current = null;
        }
      }
    };

    loadAboutContent();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMountedRef.current = false;
      
      // Abort any in-progress fetch when component unmounts
      if (fetchControllerRef.current) {
        console.log("About: Aborting fetch on unmount");
        fetchControllerRef.current.abort();
        fetchControllerRef.current = null;
      }
    };
  }, [toast]);

  const handleRetry = () => {
    console.log("About: Manual retry requested");
    setIsLoading(true);
    setError(null);
    fetchAttempts.current = 0;
    
    // Create a new AbortController for the retry
    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
    }
    fetchControllerRef.current = new AbortController();
    
    // Fetch the content again
    fetchAboutContent(fetchControllerRef.current.signal)
      .then(data => {
        if (isMountedRef.current) {
          console.log("About: Content fetched successfully on retry:", data);
          setContent(data.content || "");
          setImageUrl(data.image_url);
          setIsLoading(false);
        }
      })
      .catch(error => {
        if (isMountedRef.current && error.name !== 'AbortError') {
          console.error("About: Error on retry:", error);
          setError("Failed to load content. Please try again later.");
          setIsLoading(false);
          
          toast({
            title: "Loading Error",
            description: "Failed to load about content. Please try again.",
            variant: "destructive"
          });
        }
      });
  };

  const formatContent = (text: string) => {
    if (!text) return "";
    
    let html = text.replace(/\n/g, "<br>");
    return html;
  };

  return (
    <div>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <MultilingualTitle />
        
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-sm">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-64">
              <Spinner 
                size="lg" 
                label={error ? error : "Loading content..."}
              />
            </div>
          ) : error && !error.includes("Retrying") ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <Button 
                onClick={handleRetry} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Try Again
              </Button>
            </div>
          ) : (
            <div>
              {!authLoading && user && isAdmin && (
                <div className="flex justify-end mb-4">
                  <Link to="/admin/about">
                    <Button 
                      variant="outline" 
                      className="flex items-center text-sm"
                    >
                      <Pencil size={14} className="mr-1" />
                      Edit About
                    </Button>
                  </Link>
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-6 items-start">
                {imageUrl && (
                  <div className="w-full md:w-1/3 flex-none mb-4 md:mb-0">
                    <img 
                      src={imageUrl} 
                      alt="About" 
                      className="w-full rounded-lg object-cover"
                    />
                  </div>
                )}
                
                <div className={`flex-grow ${imageUrl ? 'w-full md:w-2/3' : 'w-full'}`}>
                  <div 
                    dangerouslySetInnerHTML={{ __html: formatContent(content) }} 
                    className="prose max-w-none leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default About;
