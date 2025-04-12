
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
    
    // Get authentication headers for logging
    const session = await supabase.auth.getSession();
    const authHeaders = session.data.session ? {
      authorization: `Bearer ${session.data.session.access_token}`,
      hasAuthToken: true
    } : { hasAuthToken: false };

    console.log("AboutService: Request authentication details", {
      isAuthenticated: !!session.data.session,
      headers: { ...authHeaders, 'apikey': '[REDACTED]' },
      timestamp: new Date().toISOString()
    });
    
    // Create the query first
    const query = supabase
      .from('about_content')
      .select('*')
      .eq('language', 'en')
      .maybeSingle();
    
    // Get the base URL from the Supabase client configuration
    // Using environment configuration instead of getClientConfig()
    const supabaseUrl = "https://dvalgsvmkrqzwfcxvbxg.supabase.co";
    
    console.log("AboutService: Query prepared, about to execute", {
      query: `SELECT * FROM ${tableName} WHERE language = 'en'`,
      url: `${supabaseUrl}/rest/v1/${tableName}?select=*&language=eq.en`,
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
      resultStatus: data ? 'success' : (error ? 'error' : 'empty'),
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
