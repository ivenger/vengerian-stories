
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
    return data.map(tag => tag.name).filter(Boolean);
  } catch (error) {
    console.error('Error in fetchAllTags:', error);
    return []; // Return empty array on error
  }
};

// Fetch tags filtered by language
export const fetchTagsByLanguage = async (language: string): Promise<string[]> => {
  try {
    // For now, we don't filter by language since all tags are in the tags table
    // In the future, you could add a language column to the tags table
    return await fetchAllTags();
  } catch (error) {
    console.error('Error in fetchTagsByLanguage:', error);
    return []; // Return empty array on error
  }
};

// Save a tag (create or update)
export const saveTag = async (tagName: string, language: string): Promise<void> => {
  try {
    if (!tagName.trim()) {
      console.log('Attempted to save empty tag name');
      return;
    }
    
    // Upsert the tag to the tags table
    const { error } = await supabase
      .from('tags')
      .upsert({
        name: tagName.trim(),
        // Add translations if provided 
        // (could be expanded in future to include language-specific translations)
      }, { onConflict: 'name' });
    
    if (error) {
      console.error('Error saving tag:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in saveTag:', error);
    throw error;
  }
};

// Delete a tag
export const deleteTag = async (tagName: string): Promise<void> => {
  try {
    // First, remove the tag from all posts that use it
    const { data: postsWithTag, error: findError } = await supabase
      .from('entries')
      .select('id, tags')
      .contains('tags', [tagName]);
    
    if (findError) {
      console.error('Error finding posts with tag:', findError);
      throw findError;
    }
    
    if (postsWithTag && postsWithTag.length > 0) {
      // Update each post to remove the tag
      for (const post of postsWithTag) {
        const updatedTags = (post.tags || []).filter(tag => tag !== tagName);
        
        // Execute update one by one
        const { error: updateError } = await supabase
          .from('entries')
          .update({ tags: updatedTags })
          .eq('id', post.id);
        
        if (updateError) {
          console.error('Error removing tag from post:', updateError);
          throw updateError;
        }
      }
    }
    
    // Then, delete the tag from the tags table
    const { error: deleteError } = await supabase
      .from('tags')
      .delete()
      .eq('name', tagName);
    
    if (deleteError) {
      console.error('Error deleting tag:', deleteError);
      throw deleteError;
    }
  } catch (error) {
    console.error('Error in deleteTag:', error);
    throw error;
  }
};
