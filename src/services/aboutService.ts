
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

  try {
    // Prepare query details for logging
    const tableName = 'about_content';
    const filter = { language: 'en' };
    const queryDetails = {
      method: 'SELECT',
      table: tableName,
      filter: filter,
      returnType: 'maybeSingle',
      timestamp: new Date().toISOString()
    };

    console.log("AboutService: Preparing Supabase request", queryDetails);
    
    // Use hardcoded URL for logging
    const supabaseUrl = "https://dvalgsvmkrqzwfcxvbxg.supabase.co";
    
    console.log("AboutService: Query prepared, about to execute", {
      query: `SELECT * FROM ${tableName} WHERE language = 'en'`,
      url: `${supabaseUrl}/rest/v1/${tableName}?select=*&language=eq.en`,
      requestHeaders: {
        'apikey': '[REDACTED]',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      timestamp: new Date().toISOString()
    });

    // Set up abort signal listener before executing query
    if (signal) {
      signal.addEventListener('abort', () => {
        console.log("AboutService: Abort signal triggered");
      });
    }
    
    // Execute the query with timeout protection
    console.log("AboutService: Executing Supabase query...");
    
    // Create a timeout promise that will reject after 5 seconds
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(() => {
        console.log("AboutService: Query execution timed out after 5 seconds");
        reject(new Error("Query timeout exceeded"));
      }, 5000);
      
      // Clean up the timeout if the signal is aborted
      if (signal) {
        signal.addEventListener('abort', () => clearTimeout(timeoutId));
      }
    });
    
    // Create the actual query
    const queryPromise = supabase
      .from('about_content')
      .select('*')
      .eq('language', 'en')
      .maybeSingle();
    
    // Race between the query and the timeout
    const { data, error } = await Promise.race([
      queryPromise,
      timeoutPromise.then(() => {
        throw new Error("Query timed out");
      })
    ]);
    
    console.log("AboutService: Query completed", { 
      hasData: !!data, 
      hasError: !!error,
      resultStatus: data ? 'success' : (error ? 'error' : 'empty'),
      timestamp: new Date().toISOString()
    });

    // Final check after query completes
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
  }
};

export const saveAboutContent = async (content: string, imageUrl: string | null): Promise<void> => {
  console.log("AboutService: Saving about content");
  
  try {
    // Add timeout protection for save operation
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        console.log("AboutService: Save operation timed out after 5 seconds");
        reject(new Error("Save operation timeout exceeded"));
      }, 5000);
    });
    
    const savePromise = supabase
      .from('about_content')
      .upsert({
        language: 'en',
        content: content,
        image_url: imageUrl
      }, { 
        onConflict: 'language' 
      });
    
    const { error } = await Promise.race([
      savePromise,
      timeoutPromise.then(() => {
        throw new Error("Save operation timed out");
      })
    ]);
    
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
