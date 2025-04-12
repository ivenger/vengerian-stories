
import { supabase } from "../integrations/supabase/client";

export interface AboutContent {
  content: string;
  image_url: string | null;
  language: string;
}

export const fetchAboutContent = async (signal?: AbortSignal): Promise<AboutContent> => {
  console.log("AboutService: Starting fetch", { 
    hasSignal: !!signal, 
    signalAborted: signal?.aborted,
    timestamp: new Date().toISOString()
  });

  // Immediately check if the request is already aborted
  if (signal?.aborted) {
    console.log("AboutService: Request aborted before starting");
    throw new DOMException("Request aborted", "AbortError");
  }

  // Set up abort signal listener
  const onAbort = () => {
    console.log("AboutService: Abort signal triggered during fetch");
  };
  
  if (signal) {
    signal.addEventListener('abort', onAbort);
  }
  
  try {
    console.log("AboutService: Executing query with 7s timeout");
    
    // Set a timeout for this specific query
    const timeoutId = setTimeout(() => {
      console.error("AboutService: Query timed out after 7 seconds");
    }, 7000);
    
    // Execute the simple, direct query without Promise.race
    console.log("AboutService: Sending request to Supabase");
    
    // Log auth state before query
    const { data: sessionData } = await supabase.auth.getSession();
    console.log("AboutService: Auth session before query:", 
      sessionData?.session ? "Valid session" : "No session", 
      { hasUser: !!sessionData?.session?.user }
    );
    
    // Execute the actual query
    const { data, error } = await supabase
      .from('about_content')
      .select('*')
      .eq('language', 'en')
      .maybeSingle();
    
    // Clear timeout since we got a response
    clearTimeout(timeoutId);
    
    console.log("AboutService: Query completed", { 
      hasData: !!data, 
      hasError: !!error,
      resultStatus: data ? 'success' : (error ? 'error' : 'empty'),
      timestamp: new Date().toISOString()
    });

    // Check if the request was aborted during execution
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
      dataSnippet: data ? { 
        contentLength: data.content?.length || 0,
        hasImage: !!data.image_url,
        language: data.language
      } : null,
      timestamp: new Date().toISOString()
    });

    return {
      content: data.content || "",
      image_url: data.image_url,
      language: data.language
    };
  } catch (err) {
    // Don't log AbortError as an error since it's expected behavior
    if (err.name === 'AbortError') {
      console.log("AboutService: Request aborted", {
        timestamp: new Date().toISOString()
      });
    } else {
      console.error("AboutService: Error during fetch", {
        error: err,
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });
    }
    throw err;
  } finally {
    // Clean up abort listener
    if (signal) {
      signal.removeEventListener('abort', onAbort);
    }
  }
};

export const saveAboutContent = async (content: string, imageUrl: string | null): Promise<void> => {
  console.log("AboutService: Saving about content");
  
  try {
    // Add timeout protection for save operation
    const timeoutId = setTimeout(() => {
      console.log("AboutService: Save operation taking longer than expected (7 seconds)");
    }, 7000);
    
    // Log auth state before save
    const { data: sessionData } = await supabase.auth.getSession();
    console.log("AboutService: Auth session before save:", 
      sessionData?.session ? "Valid session" : "No session", 
      { hasUser: !!sessionData?.session?.user }
    );
    
    const { error } = await supabase
      .from('about_content')
      .upsert({
        language: 'en',
        content: content,
        image_url: imageUrl
      }, { 
        onConflict: 'language' 
      });
    
    clearTimeout(timeoutId);
    
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
