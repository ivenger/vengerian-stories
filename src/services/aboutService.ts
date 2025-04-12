
import { supabase } from "../integrations/supabase/client";

interface AboutContent {
  content: string;
  image_url: string | null;
  language: string;
}

export const fetchAboutContent = async (signal?: AbortSignal): Promise<AboutContent> => {
  console.log("AboutService: Starting fetch", { hasSignal: !!signal, signalAborted: signal?.aborted });

  try {
<<<<<<< HEAD
    console.log("AboutService: Making Supabase request");
    
    // Create the query first
    const query = supabase
      .from('about_content')
      .select('*')
      .eq('language', 'en')
      .maybeSingle();
    
    // Handle abort signal if provided
    if (signal) {
      if (signal.aborted) {
        console.log("AboutService: Request aborted before making API call");
        throw new DOMException("Request aborted", "AbortError");
      }
      
      // Use the newer Supabase API for aborting - add an event listener
      signal.addEventListener('abort', () => {
        // This will internally cancel the request if possible
        console.log("AboutService: Abort signal triggered");
      });
    }
    
    // Execute the query
    const { data, error } = await query;
=======
    const session = await supabase.auth.getSession();
    console.log("AboutService: Session restored before request", session);

    if (!session) {
      console.error("AboutService: No session found, aborting fetch");
      throw new Error("No session available");
    }

    console.log("AboutService: Making Supabase request with token", {
      token: session.access_token,
    });

    const { data, error } = await supabase
      .from("about")
      .select("*")
      .abortSignal(signal);
>>>>>>> 127a7e6 (More logs)

    console.log("AboutService: Supabase response", { data, error });

    if (signal?.aborted) {
      console.log("AboutService: Request aborted after response");
      return;
    }

    if (error) {
      console.error("AboutService: Supabase error", { error });
      throw error;
    }

    if (!data || data.length === 0) {
      console.log("AboutService: No content found, returning default");
      return {};
    }

<<<<<<< HEAD
    console.log("AboutService: Request successful");

    return data as AboutContent;
=======
    console.log("AboutService: Request successful", { data });
    return data;
>>>>>>> 127a7e6 (More logs)
  } catch (err) {
    console.error("AboutService: Error during fetch", err);
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
