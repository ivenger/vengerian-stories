
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
    // Set a timeout to log a warning if the query takes too long
    const timeoutId = setTimeout(() => {
      console.log("AboutService: Query taking longer than expected (5 seconds)");
    }, 5000);

    // Log session information for debugging
    const { data: sessionData } = await supabase.auth.getSession();
    console.log("AboutService: Auth session before query:", {
      hasSession: !!sessionData?.session,
      hasUser: !!sessionData?.session?.user,
      userId: sessionData?.session?.user?.id || 'none',
      email: sessionData?.session?.user?.email || 'none',
      expiresAt: sessionData?.session?.expires_at ? new Date(sessionData.session.expires_at * 1000).toISOString() : 'none'
    });

    console.log("AboutService: Executing simple query with 10s timeout");
    
    // Create a safety timeout promise that will reject after 10 seconds
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Query timeout exceeded")), 10000);
    });
    
    // Race between the actual query and the timeout
    const result = await Promise.race([
      supabase
        .from('about_content')
        .select('*')
        .eq('language', 'en')
        .maybeSingle(),
      timeoutPromise
    ]);
    
    clearTimeout(timeoutId);
    
    // Check if the request was aborted during execution
    if (signal?.aborted) {
      console.log("AboutService: Request aborted after response");
      throw new DOMException("Request aborted", "AbortError");
    }

    // Since we raced with a timeout, we need to check if we got the actual response
    if ('data' in result && 'error' in result) {
      const { data, error } = result;
      
      if (error) {
        console.error("AboutService: Supabase error", error);
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
        contentLength: data.content?.length || 0,
        hasImage: !!data.image_url
      });

      return {
        content: data.content || "",
        image_url: data.image_url,
        language: data.language
      };
    } else {
      // This is likely the timeoutPromise that won the race
      throw new Error("Unexpected response format");
    }
  } catch (err) {
    // Don't log AbortError as an error since it's expected behavior
    if (err instanceof DOMException && err.name === 'AbortError') {
      console.log("AboutService: Request aborted");
    } else {
      console.error("AboutService: Error during fetch", err);
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
      console.log("AboutService: Save operation taking longer than expected (5 seconds)");
    }, 5000);
    
    // Log auth state before save
    const { data: sessionData } = await supabase.auth.getSession();
    console.log("AboutService: Auth session before save:", {
      hasSession: !!sessionData?.session,
      hasUser: !!sessionData?.session?.user,
      userId: sessionData?.session?.user?.id || 'none'
    });
    
    // Set up a safety timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Save operation timeout exceeded")), 10000);
    });
    
    // Race between the actual save operation and the timeout
    const result = await Promise.race([
      supabase
        .from('about_content')
        .upsert({
          language: 'en',
          content: content,
          image_url: imageUrl
        }, { 
          onConflict: 'language' 
        }),
      timeoutPromise
    ]);
    
    clearTimeout(timeoutId);
    
    // Since we raced with a timeout, we need to check if we got the actual response
    if ('error' in result) {
      const { error } = result;
      if (error) {
        console.error("AboutService: Error saving about content:", error);
        throw error;
      }
    }
    
    console.log("AboutService: About content saved successfully");
  } catch (error) {
    console.error("AboutService: Failed to save about content:", error);
    throw error;
  }
};
