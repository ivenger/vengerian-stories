import { supabase } from "../integrations/supabase/client";

interface AboutContent {
  content: string;
  image_url: string | null;
  language: string;
}

export const fetchAboutContent = async (signal?: AbortSignal): Promise<AboutContent> => {
  console.log("AboutService: Starting fetch", {
    hasSignal: !!signal,
    signalAborted: signal?.aborted
  });
  
  // Immediately check for aborted signal
  if (signal?.aborted) {
    console.log("AboutService: Request aborted before fetch");
    throw new DOMException("Request aborted", "AbortError");
  }

  try {
    // Create AbortController for the timeout
    const timeoutController = new AbortController();
    const timeout = setTimeout(() => {
      timeoutController.abort();
    }, 10000);

    console.log("AboutService: Making Supabase request");
    const { data, error } = await supabase
      .from('about_content')
      .select('*')
      .eq('language', 'en')
      .maybeSingle();

    clearTimeout(timeout);

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
      
      // Handle auth errors by throwing a specific error
      if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
        throw new Error('AuthError');
      }
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
  } catch (error: any) {
    console.log("AboutService: Error in fetch", {
      name: error.name,
      message: error.message,
      isAbortError: error instanceof DOMException && error.name === "AbortError"
    });

    if (error.message === 'AuthError') {
      // Give the auth system a chance to refresh the token
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw error;
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
