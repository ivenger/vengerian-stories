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
    isMountedRef.current = true;
    fetchAttempts.current = 0;
    let currentController: AbortController | null = null;

    const loadAboutContent = async () => {
      // Clear any existing error state and show loading
      setError(null);
      setIsLoading(true);

      // Cancel any in-flight request
      if (currentController) {
        currentController.abort();
      }

      // Create new controller for this request
      currentController = new AbortController();
      fetchControllerRef.current = currentController;

      try {
        console.log("About: Fetching about content...");
        const data = await fetchAboutContent(currentController.signal);

        // Only update state if this is still the current request
        if (isMountedRef.current && fetchControllerRef.current === currentController) {
          console.log("About: Content fetched successfully");
          setContent(data.content || "");
          setImageUrl(data.image_url);
          setError(null);
          fetchAttempts.current = 0;
        }
      } catch (error: any) {
        // Ignore aborted requests
        if (error.name === "AbortError") {
          console.log("About: Fetch aborted");
          return;
        }

        // Only handle error if this is still the current request
        if (isMountedRef.current && fetchControllerRef.current === currentController) {
          console.error("About: Error loading about content:", error);

          if (fetchAttempts.current < maxRetries) {
            const retryDelay = Math.min(1000 * Math.pow(2, fetchAttempts.current), 5000);
            fetchAttempts.current += 1;

            console.log(`About: Retrying in ${retryDelay}ms (attempt ${fetchAttempts.current}/${maxRetries})`);
            setError(`Loading failed. Retrying in ${Math.round(retryDelay/1000)} seconds...`);

            // Schedule retry
            setTimeout(() => {
              if (isMountedRef.current) {
                loadAboutContent();
              }
            }, retryDelay);
          } else {
            setError("Content could not be loaded. Please try again later.");
            toast({
              title: "Loading Error",
              description: "Failed to load about content after multiple attempts.",
              variant: "destructive"
            });
          }
        }
      } finally {
        // Only update loading state if this is still the current request
        if (isMountedRef.current && fetchControllerRef.current === currentController) {
          setIsLoading(false);
        }
      }
    };

    // Start initial load
    loadAboutContent();

    return () => {
      console.log("About: Component unmounting, cleaning up");
      isMountedRef.current = false;
      
      // Abort any in-flight request
      if (currentController) {
        console.log("About: Aborting fetch on unmount");
        currentController.abort();
      }
      fetchControllerRef.current = null;
    };
  }, [toast, maxRetries]);

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
