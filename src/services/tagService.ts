import { supabase } from "../integrations/supabase/client";

// Use same session validation pattern as postService
const withSessionValidation = async <T>(
  operation: () => Promise<T>,
  maxAttempts = 3
): Promise<T> => {
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    try {
      // Check session before each attempt
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          throw new Error("No valid session");
        }
      }
      
      return await operation();
    } catch (error: any) {
      attempt++;
      
      if (error.message === "No valid session" || attempt >= maxAttempts) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error("Max retry attempts reached");
};

// Fetch all available tags
export const fetchAllTags = async (): Promise<string[]> => {
  return withSessionValidation(async () => {
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
      return data.map(tag => tag.name).filter(Boolean);
    } catch (error) {
      console.error('Error in fetchAllTags:', error);
      return []; // Return empty array on error
    }
  });
};

// Fetch tags filtered by language
export const fetchTagsByLanguage = async (): Promise<string[]> => {
  return withSessionValidation(async () => {
    try {
      // Since we've removed language filtering, we just return all tags
      return await fetchAllTags();
    } catch (error) {
      console.error('Error in fetchTagsByLanguage:', error);
      return []; // Return empty array on error
    }
  });
};

// Save tag
export const saveTag = async (
  tagName: string, 
  translations: { en: string; he: string; ru: string }
): Promise<void> => {
  return withSessionValidation(async () => {
    const { error } = await supabase
      .from('tags')
      .insert({
        name: tagName.trim(),
        en: translations.en.trim() || tagName.trim(),
        he: translations.he.trim() || null,
        ru: translations.ru.trim() || null
      });
    
    if (error) {
      console.error('Error saving tag:', error);
      throw error;
    }
  });
};

// Delete tag
export const deleteTag = async (tagName: string): Promise<void> => {
  return withSessionValidation(async () => {
    try {
      // First delete the tag itself
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('name', tagName);
      
      if (error) {
        throw error;
      }
      
      // Then find and update any posts that use this tag
      const { data: postsWithTag, error: findError } = await supabase
        .from('entries')
        .select('id, tags')
        .contains('tags', [tagName]);
      
      if (findError) {
        throw findError;
      }
      
      // Update each post to remove the deleted tag
      if (postsWithTag && postsWithTag.length > 0) {
        for (const post of postsWithTag) {
          const updatedTags = (post.tags || []).filter(tag => tag !== tagName);
          
          const { error: updateError } = await supabase
            .from('entries')
            .update({ tags: updatedTags })
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
  });
};
