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
  
  try {
    console.log("AboutService: Making Supabase request with token", {
      token: localStorage.getItem('supabase.auth.token'),
    });
    const { data, error } = await supabase
      .from('about_content')
      .select('*')
      .eq('language', 'en')
      .maybeSingle()
      .abortSignal(signal);

    console.log("AboutService: Supabase response", { data, error });

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

    console.log("AboutService: All content loaded successfully", {
      content: data.content,
      image_url: data.image_url,
      language: data.language
    });

    return data as AboutContent;
  } catch (error) {
    console.log("AboutService: Error in fetch", {
      name: error.name,
      message: error.message,
      isAbortError: error instanceof DOMException && error.name === "AbortError"
    });

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
