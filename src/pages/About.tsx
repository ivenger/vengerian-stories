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
        hasExistingController: !!currentController,
        currentContent: !!content
      });

      setError(null);
      if (fetchAttempts.current === 0) {
        setIsLoading(true);
      }

      if (currentController) {
        console.log("About: Aborting existing request");
        currentController.abort();
      }

      currentController = new AbortController();
      fetchControllerRef.current = currentController;

      try {
        console.log("About: Initiating fetch request", {
          fetchAttempts: fetchAttempts.current,
          signal: currentController.signal.aborted
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

        console.log("About: Content fetched successfully", {
          hasContent: !!data.content,
          hasImage: !!data.image_url
        });

        setContent(data.content || "");
        setImageUrl(data.image_url);
        setError(null);
        fetchAttempts.current = 0;
      } catch (error: any) {
        if (!isMountedRef.current) {
          console.log("About: Error occurred but component unmounted - ignoring", error);
          return;
        }
        
        console.log("About: Fetch error occurred", {
          errorName: error.name,
          errorMessage: error.message,
          isAborted: error.name === "AbortError",
          currentAttempt: fetchAttempts.current
        });

        if (error.name === "AbortError") {
          console.log("About: Request aborted - skipping error handling");
          return;
        }

        if (isMountedRef.current && fetchControllerRef.current === currentController) {
          console.error("About: Error loading about content:", error);

          if (fetchAttempts.current < maxRetries) {
            const retryDelay = Math.min(1000 * Math.pow(2, fetchAttempts.current), 5000);
            fetchAttempts.current += 1;

            console.log("About: Scheduling retry", {
              attempt: fetchAttempts.current,
              maxRetries,
              delay: retryDelay
            });

            setError(`Loading failed. Retrying in ${Math.round(retryDelay/1000)} seconds...`);

            setTimeout(() => {
              if (isMountedRef.current) {
                console.log("About: Executing scheduled retry");
                loadAboutContent();
              } else {
                console.log("About: Skipping scheduled retry - component unmounted");
              }
            }, retryDelay);
          } else {
            console.log("About: Max retries reached - showing error");
            setError("Content could not be loaded. Please try again later.");
            toast({
              title: "Loading Error",
              description: "Failed to load about content after multiple attempts.",
              variant: "destructive"
            });
          }
        }
      } finally {
        if (isMountedRef.current && fetchControllerRef.current === currentController) {
          console.log("About: Completing request", {
            hasError: !!error,
            contentLength: content.length,
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
      }
      fetchControllerRef.current = null;
    };
  }, [toast, maxRetries, content]);

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
            title: "Error",
            description: "Failed to load content on retry.",
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
