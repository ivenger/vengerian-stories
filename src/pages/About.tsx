import React, { useState, useEffect, useRef } from "react";
import { fetchAboutContent } from "../services/aboutService";
import MultilingualTitle from "@/components/MultilingualTitle";
import { useAuth } from "@/hooks/auth/useAuth";
import Navigation from "../components/Navigation";
import { useToast } from "@/hooks/use-toast";
import AboutLoadingState from "@/components/about/AboutLoadingState";
import AboutContent from "@/components/about/AboutContent";

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
    fetchAttempts.current = 0;
  }, []);
  
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
        setContent(data.content);
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
  }, [toast, maxRetries]);

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

  return (
    <div>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <MultilingualTitle />
        
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-sm">
          {isLoading ? (
            <AboutLoadingState error={error} onRetry={handleRetry} />
          ) : error && !error.includes("Retrying") ? (
            <AboutLoadingState error={error} onRetry={handleRetry} />
          ) : (
            <AboutContent 
              content={content}
              imageUrl={imageUrl}
              isAdmin={isAdmin}
              user={user}
              authLoading={authLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default About;
