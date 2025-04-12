
import { supabase } from "../integrations/supabase/client";

// Fetch all available tags
export const fetchAllTags = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('name');
    
    if (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }
    
    // Check if data exists
    if (!data || !Array.isArray(data)) {
      console.log('No data returned from tags query');
      return [];
    }
    
    // Extract tag names
    return data.map((tag: any) => tag.name as string).filter(Boolean);
  } catch (error) {
    console.error('Error in fetchAllTags:', error);
    return []; // Return empty array on error
  }
};

// Fetch tags filtered by language
export const fetchTagsByLanguage = async (): Promise<string[]> => {
  try {
    // Since we've removed language filtering, we just return all tags
    return await fetchAllTags();
  } catch (error) {
    console.error('Error in fetchTagsByLanguage:', error);
    return []; // Return empty array on error
  }
};

// Save tag
export const saveTag = async (tagName: string, translations: { en: string; he: string; ru: string }): Promise<void> => {
  try {
    const insertData = {
      name: tagName.trim(),
      en: translations.en.trim() || tagName.trim(),
      he: translations.he.trim() || null,
      ru: translations.ru.trim() || null
    };
    
    const { error } = await supabase
      .from('tags')
      .insert(insertData as any);
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error saving tag:', error);
    throw error;
  }
};

// Delete tag
export const deleteTag = async (tagName: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('name', tagName as string);
    
    if (error) {
      throw error;
    }
    
    const { data: postsWithTag, error: findError } = await supabase
      .from('entries')
      .select('id, tags')
      .contains('tags', [tagName]);
    
    if (findError) {
      throw findError;
    }
    
    if (postsWithTag) {
      for (const post of postsWithTag) {
        const postTags = post.tags || [];
        const updatedTags = postTags.filter((tag: string) => tag !== tagName);
        
        const { error: updateError } = await supabase
          .from('entries')
          .update({ tags: updatedTags } as any)
          .eq('id', post.id);
        
        if (updateError) {
          throw updateError;
        }
      }
    }
  } catch (error) {
    console.error('Error deleting tag:', error);
    throw error;
  }
};
