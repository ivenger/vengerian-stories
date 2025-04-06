import { supabase } from "../integrations/supabase/client";

interface AboutContent {
  content: string;
  image_url: string | null;
  language: string;
}

export const fetchAboutContent = async (signal?: AbortSignal): Promise<AboutContent> => {
  console.log("AboutService: Fetching about content from Supabase");
  
  try {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    // Create the fetch promise that returns a proper Promise
    const fetchPromise = new Promise<any>(async (resolve, reject) => {
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

    // Create promises array for racing
    const promises: Promise<any>[] = [fetchPromise];

    if (signal) {
      promises.push(
        new Promise((_, reject) => {
          signal.addEventListener('abort', () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        })
      );
    }

    const { data, error } = await Promise.race(promises);
    
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
