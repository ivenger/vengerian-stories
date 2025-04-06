
import { supabase } from "../integrations/supabase/client";

// Fetch all tags
export const fetchAllTags = async (): Promise<string[]> => {
  try {
    console.log("Fetching all tags");
    const { data, error } = await supabase
      .from('tags')
      .select('name');
    
    if (error) {
      console.error('Error fetching tags:', error);
      throw new Error(`Failed to fetch tags: ${error.message}`);
    }
    
    // Use type guard to safely extract tag names
    const tagNames = (data || []).map(item => {
      if (item && typeof item === 'object' && 'name' in item) {
        return item.name as string;
      }
      return '';
    }).filter(name => name !== '');
    
    console.log(`Fetched ${tagNames.length} tags successfully`);
    return tagNames;
  } catch (error: any) {
    console.error('Failed to fetch tags:', error);
    return [];
  }
};

// Save a tag with translations
export const saveTag = async (
  tagName: string, 
  translations: { en: string; he: string; ru: string }
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('tags')
      .insert({
        name: tagName,
        en: translations.en || tagName,
        he: translations.he || null,
        ru: translations.ru || null
      } as any);
      
    if (error) {
      console.error('Error saving tag:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to save tag:', error);
    return false;
  }
};

// Delete a tag
export const deleteTag = async (tagName: string): Promise<boolean> => {
  try {
    // First delete the tag
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('name', tagName as any);
      
    if (error) {
      console.error('Error deleting tag:', error);
      return false;
    }
    
    // Find posts that contain this tag
    const { data: postsWithTag, error: findError } = await supabase
      .from('entries')
      .select('id, tags')
      .contains('tags', [tagName]);
      
    if (findError) {
      console.error('Error finding posts with tag:', findError);
      return true; // Tag was deleted, so return success even if we can't update posts
    }
    
    // Update posts to remove the deleted tag
    if (postsWithTag && postsWithTag.length > 0) {
      for (const post of postsWithTag) {
        // Add type guard
        if (!post || typeof post !== 'object' || !('id' in post) || !('tags' in post)) continue;
        
        const updatedTags = Array.isArray(post.tags) ? post.tags.filter(tag => tag !== tagName) : [];
        
        const { error: updateError } = await supabase
          .from('entries')
          .update({ tags: updatedTags } as any)
          .eq('id', post.id as any);
          
        if (updateError) {
          console.error(`Error updating post ${post.id} to remove tag:`, updateError);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Failed to delete tag:', error);
    return false;
  }
};

export const fetchTagsByLanguage = async (language = 'en') => {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*');

    if (error) {
      throw error;
    }

    // Transform tags for the requested language
    return data.map(tag => ({
      id: tag.id as string,
      name: tag[language] || tag.name || tag.en || '',
      language
    }));
  } catch (error) {
    console.error('Error fetching tags by language:', error);
    return [];
  }
};
