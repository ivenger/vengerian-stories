
import { supabase } from "../integrations/supabase/client";

// Fetch about content
export const fetchAboutContent = async (): Promise<{ content: string; image_url: string | null; language: string }> => {
  try {
    console.log("AboutService: Fetching about content from Supabase");
    
    const { data, error } = await supabase
      .from('about_content')
      .select('content, image_url, language')
      .eq('language', 'en')  // Default to English content
      .maybeSingle();
    
    if (error) {
      console.error(`AboutService: Error fetching about content:`, error);
      throw error;
    }
    
    console.log("AboutService: About content retrieved:", data);
    return data || { content: "", image_url: null, language: "en" };
  } catch (error) {
    console.error('AboutService: Error in fetchAboutContent:', error);
    throw error;
  }
};

// Save about content
export const saveAboutContent = async (contentData: { content: string; image_url: string | null }): Promise<void> => {
  try {
    console.log("AboutService: Saving about content:", contentData);
    
    const { data: existingData } = await supabase
      .from('about_content')
      .select('id, language')
      .eq('language', 'en')  // Default to English content
      .maybeSingle();
    
    // Add the required language field to the content data
    const fullContentData = {
      ...contentData,
      language: 'en'  // Add the required language field
    };
    
    if (existingData?.id) {
      // Update existing record
      console.log("AboutService: Updating existing about content record");
      const { error } = await supabase
        .from('about_content')
        .update(fullContentData)
        .eq('id', existingData.id);
      
      if (error) {
        console.error("AboutService: Error updating about content:", error);
        throw error;
      }
      
      console.log("AboutService: About content updated successfully");
    } else {
      // Insert new record
      console.log("AboutService: Creating new about content record");
      const { error } = await supabase
        .from('about_content')
        .insert([fullContentData]);
      
      if (error) {
        console.error("AboutService: Error creating about content:", error);
        throw error;
      }
      
      console.log("AboutService: About content created successfully");
    }
  } catch (error) {
    console.error(`AboutService: Error saving about content:`, error);
    throw error;
  }
};
