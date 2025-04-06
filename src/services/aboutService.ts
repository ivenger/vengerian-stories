import { supabase } from "../integrations/supabase/client";

interface AboutContent {
  content: string;
  image_url: string | null;
  language: string;
}

export const fetchAboutContent = async (signal?: AbortSignal): Promise<AboutContent> => {
  console.log("AboutService: Fetching about content from Supabase");
  
  try {
    // Immediately check if already aborted
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    // Create an abort handler promise if signal provided
    let abortPromise: Promise<never> | undefined;
    if (signal) {
      abortPromise = new Promise((_, reject) => {
        // Handle both immediate and future aborts
        const abortHandler = () => reject(new DOMException("Aborted", "AbortError"));
        signal.addEventListener("abort", abortHandler);
      });
    }

    // Wrap Supabase query in a proper promise
    const fetchPromise = new Promise<{ data: AboutContent | null; error: any }>(async (resolve, reject) => {
      try {
        const result = await supabase
          .from('about_content')
          .select('*')
          .eq('language', 'en')
          .maybeSingle();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });

    // Race between fetch and abort if signal provided
    const { data, error } = await (abortPromise 
      ? Promise.race([fetchPromise, abortPromise])
      : fetchPromise);

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
    // Log and rethrow the error, maintaining its type
    if (error instanceof DOMException && error.name === "AbortError") {
      console.log("AboutService: Fetch aborted");
    } else {
      console.error("AboutService: Failed to fetch about content:", error);
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
