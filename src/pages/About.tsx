
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
  const isFirstMount = useRef(true);
  const mountCountRef = useRef(0);
  useEffect(() => {
    fetchAttempts.current = 0; // Reset fetch attempts
  }, []);
  // Main effect for loading content
  useEffect(() => {
    console.log("About: Component mounting", {
      mountCount: ++mountCountRef.current,
      isFirstMount: isFirstMount.current,
      fetchAttempts: fetchAttempts.current,
      isMounted: isMountedRef.current,
      hasController: !!fetchControllerRef.current
    });

    isMountedRef.current = true;
    
    if (isFirstMount.current) {
      console.log("About: First mount - resetting fetch state");
      fetchAttempts.current = 0;
      isFirstMount.current = false;
    }

    let currentController: AbortController | null = null;

    const loadAboutContent = async () => {
      if (!isMountedRef.current) {
        console.log("About: Skipping load - component unmounted");
        return;
      }

      console.log("About: Starting content load", {
        fetchAttempts: fetchAttempts.current,
        hasExistingController: !!currentController
      });

      setError(null);
      if (fetchAttempts.current === 0) {
        setIsLoading(true);
      }

      // Clean up any existing request
      if (currentController) {
        console.log("About: Aborting existing request");
        currentController.abort();
      }

      currentController = new AbortController();
      fetchControllerRef.current = currentController;

      try {
        console.log("About: Initiating fetch request", {
          fetchAttempts: fetchAttempts.current,
          signal: currentController.signal.aborted,
        });

        const data = await fetchAboutContent(currentController.signal);
        if (!isMountedRef.current) {
          console.log("About: Fetch completed but component unmounted - discarding result");
          return;
        }

        if (fetchControllerRef.current !== currentController) {
          console.log("About: Fetch completed but controller changed - discarding result");
          return;
        }

        console.log("About: Content fetched successfully", { data });
        if (typeof data.content === 'string') {
          setContent(data.content);
        } else {
          // Handle the case where content might not be a string
          setContent(data.content ? String(data.content) : "");
        }
        
        setImageUrl(data.image_url);
        fetchAttempts.current = 0;
      } catch (error) {
        console.log("About: Fetch error occurred", { error, currentAttempt: fetchAttempts.current });

        if (isMountedRef.current && fetchControllerRef.current === currentController) {
          if (fetchAttempts.current < maxRetries) {
            const retryDelay = Math.min(1000 * Math.pow(2, fetchAttempts.current), 5000);
            fetchAttempts.current += 1;
            console.log("About: Retrying fetch", { attempt: fetchAttempts.current, retryDelay });
            setTimeout(loadAboutContent, retryDelay);
          } else {
            console.log("About: Max retries reached, giving up", { attemptsMade: fetchAttempts.current });
          }
        }
      } finally {
        if (isMountedRef.current && fetchControllerRef.current === currentController) {
          console.log("About: Completing request", {
            hasError: !!error,
            attemptsMade: fetchAttempts.current
          });
          setIsLoading(false);
        }
      }
    };

    loadAboutContent();

    return () => {
      console.log("About: Component unmounting", {
        mountCount: mountCountRef.current,
        hasController: !!currentController,
        isMounted: isMountedRef.current,
        fetchAttempts: fetchAttempts.current
      });

      isMountedRef.current = false;
      
      if (currentController) {
        console.log("About: Cleaning up controller");
        currentController.abort();
        currentController = null;
      }
      fetchControllerRef.current = null;
    };
  }, [toast, maxRetries]); // Removed content from dependencies

  const handleRetry = () => {
    console.log("About: Manual retry requested");
    setIsLoading(true);
    setError(null);
    fetchAttempts.current = 0;
    
    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
    }
    fetchControllerRef.current = new AbortController();
    
    fetchAboutContent(fetchControllerRef.current.signal)
      .then(data => {
        if (isMountedRef.current) {
          console.log("About: Content fetched successfully on retry:", data);
          // Make sure we're setting a string to content
          if (typeof data.content === 'string') {
            setContent(data.content);
          } else {
            setContent(data.content ? String(data.content) : "");
          }
          setImageUrl(data.image_url);
          setIsLoading(false);
        }
      })
      .catch(error => {
        if (isMountedRef.current && error.name !== 'AbortError') {
          console.error("About: Error on retry:", error);
          setError("Failed to load About content. Please try again later.");
          setIsLoading(false);
          
          toast({
            title: "Error",
            description: "Failed to load About content on retry.",
            variant: "destructive"
          });
        }
      });
  };

  const formatContent = (text: string | unknown): string => {
    if (!text) return "";
    // Make sure text is a string before calling replace
    if (typeof text !== 'string') {
      return String(text);
    }
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
