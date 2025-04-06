
import { supabase } from "../integrations/supabase/client";

interface AboutContent {
  content: string;
  image_url: string | null;
  language: string;
}

export const fetchAboutContent = async (signal?: AbortSignal): Promise<AboutContent> => {
  console.log("AboutService: Fetching about content from Supabase");
  
  // Create a promise that will be rejected if the signal is aborted
  if (signal) {
    if (signal.aborted) {
      return Promise.reject(new DOMException("Aborted", "AbortError"));
    }
    
    // If the signal is aborted during the fetch, reject the promise
    const abortPromise = new Promise<never>((_, reject) => {
      signal.addEventListener("abort", () => {
        reject(new DOMException("Aborted", "AbortError"));
      });
    });
    
    // Race between the fetch and the abort
    try {
      const { data, error } = await Promise.race([
        supabase
          .from('about_content')
          .select('*')
          .eq('language', 'en')
          .maybeSingle(),
        abortPromise
      ]);
      
      if (error) {
        console.error("AboutService: Error fetching about content:", error);
        throw error;
      }
      
      if (!data) {
        console.warn("AboutService: No about content found");
        return {
          content: "Content coming soon...",
          image_url: null,
          language: "en"
        };
      }
      
      console.log("AboutService: About content fetched successfully");
      return data as AboutContent;
    } catch (error) {
      console.error("AboutService: Failed to fetch about content:", error);
      throw error;
    }
  } else {
    // If no signal is provided, just fetch normally
    try {
      const { data, error } = await supabase
        .from('about_content')
        .select('*')
        .eq('language', 'en')
        .maybeSingle();
      
      if (error) {
        console.error("AboutService: Error fetching about content:", error);
        throw error;
      }
      
      if (!data) {
        console.warn("AboutService: No about content found");
        return {
          content: "Content coming soon...",
          image_url: null,
          language: "en"
        };
      }
      
      console.log("AboutService: About content fetched successfully");
      return data as AboutContent;
    } catch (error) {
      console.error("AboutService: Failed to fetch about content:", error);
      throw error;
    }
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
