
import { supabase } from "../integrations/supabase/client";

export interface AboutContent {
  content: string;
  image_url: string | null;
  language: string;
}

export const fetchAboutContent = async (signal?: AbortSignal): Promise<AboutContent> => {
  console.log("About: First mount - resetting fetch state");
  console.log("About: Starting content load", { fetchAttempts: 0, hasExistingController: false });
  console.log("About: Initiating fetch request", { fetchAttempts: 0, signal: !!signal });
  console.log("AboutService: Starting fetch", { 
    hasSignal: !!signal, 
    signalAborted: signal?.aborted,
    timestamp: new Date().toISOString()
  });

  try {
    console.log("AboutService: Preparing Supabase request", {
      table: 'about_content',
      filter: { language: 'en' },
      timestamp: new Date().toISOString()
    });
    
    // Create the query first
    const query = supabase
      .from('about_content')
      .select('*')
      .eq('language', 'en')
      .maybeSingle();
    
    console.log("AboutService: Query prepared, about to execute", {
      timestamp: new Date().toISOString()
    });

    // Handle abort signal if provided
    if (signal) {
      if (signal.aborted) {
        console.log("AboutService: Request aborted before making API call");
        throw new DOMException("Request aborted", "AbortError");
      }
      
      signal.addEventListener('abort', () => {
        console.log("AboutService: Abort signal triggered");
      });
    }
    
    // Execute the query
    console.log("AboutService: Executing Supabase query...");
    const { data, error } = await query;
    console.log("AboutService: Query completed", { 
      hasData: !!data, 
      hasError: !!error,
      timestamp: new Date().toISOString()
    });

    if (signal?.aborted) {
      console.log("AboutService: Request aborted after response");
      throw new DOMException("Request aborted", "AbortError");
    }

    if (error) {
      console.error("AboutService: Supabase error", { 
        error,
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message
      });
      throw error;
    }

    if (!data) {
      console.log("AboutService: No content found, returning default");
      return {
        content: "",
        image_url: null,
        language: "en"
      };
    }

    console.log("AboutService: Request successful", {
      dataReceived: !!data,
      timestamp: new Date().toISOString()
    });

    return {
      content: data.content || "",
      image_url: data.image_url,
      language: data.language
    };
  } catch (err) {
    console.error("AboutService: Error during fetch", {
      error: err,
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
    throw err;
  }
};

export const saveAboutContent = async (content: string, imageUrl: string | null): Promise<void> => {
  console.log("AboutService: Saving about content");
  
  try {
    const { error } = await supabase
      .from('about_content')
      .upsert({
        language: 'en',
        content: content,
        image_url: imageUrl
      }, { 
        onConflict: 'language' 
      });
    
    if (error) {
      console.error("AboutService: Error saving about content:", error);
      throw error;
    }
    
    console.log("AboutService: About content saved successfully");
  } catch (error) {
    console.error("AboutService: Failed to save about content:", error);
    throw error;
  }
};
