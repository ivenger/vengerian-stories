
import { supabase } from "../integrations/supabase/client";

// Fetch about content
export const fetchAboutContent = async (): Promise<{ content: string; image_url: string | null; language?: string }> => {
  try {
    console.log("Fetching about content from Supabase");
    
    const { data, error } = await supabase
      .from('about_content')
      .select('content, image_url, language')
      .single();
    
    if (error) {
      console.error(`Error fetching about content:`, error);
      throw error;
    }
    
    console.log("About content retrieved:", data);
    return data || { content: "", image_url: null, language: "English" };
  } catch (error) {
    console.error('Error in fetchAboutContent:', error);
    throw error;
  }
};

// Save about content
export const saveAboutContent = async (contentData: { content: string; image_url: string | null }): Promise<void> => {
  try {
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
      const { error } = await supabase
        .from('about_content')
        .update(dataToSave)
        .eq('id', existingData.id);
      
      if (error) throw error;
    } else {
      // Insert new record
      const { error } = await supabase
        .from('about_content')
        .insert(dataToSave);
      
      if (error) throw error;
    }
  } catch (error) {
    console.error(`Error saving about content:`, error);
    throw error;
  }
};
