
import { supabase } from "../integrations/supabase/client";

// Fetch about content
export const fetchAboutContent = async (): Promise<{ content: string; image_url: string | null; language?: string }> => {
  try {
    console.log("Fetching about content from Supabase");
    
    const { data, error } = await supabase
      .from('about_content')
      .select('content, image_url, language')
      .maybeSingle();
    
    if (error) {
      console.error(`Error fetching about content:`, error);
      throw error;
    }
    
    console.log("About content retrieved:", data);
    return data || { content: "", image_url: null };
  } catch (error) {
    console.error('Error in fetchAboutContent:', error);
    throw error;
  }
};

// Save about content
export const saveAboutContent = async (contentData: { content: string; image_url: string | null }): Promise<void> => {
  try {
    console.log("Saving about content:", contentData);
    
    const dataToSave = { 
      ...contentData,
      language: "English" // Default language since language filtering is removed
    };
    
    const { data: existingData } = await supabase
      .from('about_content')
      .select('id')
      .maybeSingle();
    
    if (existingData?.id) {
      // Update existing record
      console.log("Updating existing about content record");
      const { error } = await supabase
        .from('about_content')
        .update(dataToSave)
        .eq('id', existingData.id);
      
      if (error) {
        console.error("Error updating about content:", error);
        throw error;
      }
      
      console.log("About content updated successfully");
    } else {
      // Insert new record
      console.log("Creating new about content record");
      const { error } = await supabase
        .from('about_content')
        .insert(dataToSave);
      
      if (error) {
        console.error("Error creating about content:", error);
        throw error;
      }
      
      console.log("About content created successfully");
    }
  } catch (error) {
    console.error(`Error saving about content:`, error);
    throw error;
  }
};
