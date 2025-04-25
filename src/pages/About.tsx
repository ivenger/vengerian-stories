
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
  const maxRetries = 2; // Reduced from 3 to improve performance
  const fetchControllerRef = useRef<AbortController | null>(null);
  const dataLoadedRef = useRef(false);
  
  useEffect(() => {
    console.log("About: Component mounting");
    isMountedRef.current = true;
    
    // Skip if data already loaded
    if (dataLoadedRef.current) {
      console.log("About: Data already loaded, skipping fetch");
      return;
    }

    let currentController: AbortController | null = null;

    const loadAboutContent = async () => {
      if (!isMountedRef.current) {
        return;
      }

      setError(null);
      if (fetchAttempts.current === 0) {
        setIsLoading(true);
      }

      // Clean up any existing request
      if (currentController) {
        currentController.abort();
      }

      currentController = new AbortController();
      fetchControllerRef.current = currentController;

      try {
        const data = await fetchAboutContent(currentController.signal);
        
        if (!isMountedRef.current || fetchControllerRef.current !== currentController) {
          return;
        }

        if (!data) {
          setContent("No content available.");
          setImageUrl(null);
        } else {
          setContent(data.content || "");
          setImageUrl(data.image_url);
        }
        
        setIsLoading(false);
        fetchAttempts.current = 0;
        dataLoadedRef.current = true;
      } catch (error: any) {
        // Skip error handling for aborted requests
        if (error.name === 'AbortError') {
          return;
        }

        if (isMountedRef.current && fetchControllerRef.current === currentController) {
          if (fetchAttempts.current < maxRetries) {
            const retryDelay = Math.min(1000 * Math.pow(2, fetchAttempts.current), 5000);
            fetchAttempts.current += 1;
            setTimeout(loadAboutContent, retryDelay);
          } else {
            setError("Failed to load About content. Please try again later.");
            setIsLoading(false);
          }
        }
      }
    };

    loadAboutContent();

    return () => {
      isMountedRef.current = false;
      
      if (currentController) {
        currentController.abort();
      }
      fetchControllerRef.current = null;
    };
  }, [maxRetries]);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    fetchAttempts.current = 0;
    dataLoadedRef.current = false;
    
    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
    }
    fetchControllerRef.current = new AbortController();
    
    fetchAboutContent(fetchControllerRef.current.signal)
      .then(data => {
        if (isMountedRef.current) {
          setContent(data?.content || "");
          setImageUrl(data?.image_url);
          setIsLoading(false);
          dataLoadedRef.current = true;
        }
      })
      .catch(error => {
        if (isMountedRef.current && error.name !== 'AbortError') {
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
