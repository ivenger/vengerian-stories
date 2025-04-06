import { supabase } from "../integrations/supabase/client";

interface AboutContent {
  content: string;
  image_url: string | null;
  language: string;
}

// Add retry logic with exponential backoff
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxAttempts = 3,
  signal?: AbortSignal
): Promise<T> => {
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    try {
      if (signal?.aborted) {
        throw new DOMException("Request aborted", "AbortError");
      }

      // Check session before each attempt
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          throw new Error("No valid session");
        }
      }
      
      return await operation();
    } catch (error: any) {
      attempt++;
      
      if (error.name === "AbortError" || attempt >= maxAttempts) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error("Max retry attempts reached");
};

export const fetchAboutContent = async (signal?: AbortSignal): Promise<AboutContent> => {
  console.log("AboutService: Starting fetch", {
    hasSignal: !!signal,
    signalAborted: signal?.aborted
  });
  
  return retryWithBackoff(async () => {
    console.log("AboutService: Making Supabase request");
    const { data, error } = await supabase
      .from('about_content')
      .select('*')
      .eq('language', 'en')
      .maybeSingle()
      .abortSignal(signal);

    if (signal?.aborted) {
      console.log("AboutService: Request aborted after response");
      throw new DOMException("Request aborted", "AbortError");
    }

    if (error) {
      console.error("AboutService: Supabase error", {
        code: error.code,
        message: error.message,
        details: error.details
      });
      throw error;
    }

    if (!data) {
      console.log("AboutService: No content found, returning default");
      return {
        content: "Content coming soon...",
        image_url: null,
        language: "en"
      };
    }

    console.log("AboutService: Request successful", {
      hasContent: !!data.content,
      hasImage: !!data.image_url,
      language: data.language
    });

    return data as AboutContent;
  }, 3, signal);
};

export const saveAboutContent = async (content: string, imageUrl: string | null): Promise<void> => {
  return retryWithBackoff(async () => {
    console.log("AboutService: Saving about content");
    
    const { error } = await supabase
      .from('about_content')
      .upsert({
        language: 'en',
        content,
        image_url: imageUrl
      });
    
    if (error) {
      console.error("AboutService: Error saving content:", error);
      throw error;
    }
    
    console.log("AboutService: Content saved successfully");
  });
};
