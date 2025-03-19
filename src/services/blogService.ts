
import { supabase } from "../integrations/supabase/client";
import { BlogEntry } from "../types/blogTypes";
import { fetchAllTags as fetchAllTagsOriginal } from "./tagService";

// Fetch all published blog posts
export const fetchPublishedPosts = async (): Promise<BlogEntry[]> => {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('status', 'published')
    .order('date', { ascending: false });
  
  if (error) {
    console.error('Error fetching published posts:', error);
    throw error;
  }
  
  return data as BlogEntry[] || [];
};

// Fetch all blog posts (for admin)
export const fetchAllPosts = async (): Promise<BlogEntry[]> => {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .order('date', { ascending: false });
  
  if (error) {
    console.error('Error fetching all posts:', error);
    throw error;
  }
  
  return data as BlogEntry[] || [];
};

// Fetch a single blog post by ID
export const fetchPostById = async (id: string): Promise<BlogEntry | null> => {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) {
    console.error(`Error fetching post with ID ${id}:`, error);
    throw error;
  }
  
  return data as BlogEntry;
};

// Fetch related translations for a post
export const fetchRelatedTranslations = async (postId: string): Promise<BlogEntry[]> => {
  try {
    // First get the current post to access its translations array
    const { data: currentPost, error: postError } = await supabase
      .from('entries')
      .select('translations')
      .eq('id', postId)
      .maybeSingle();
    
    if (postError) {
      throw postError;
    }
    
    if (!currentPost?.translations?.length) {
      return [];
    }
    
    // Fetch all posts that are in the translations array
    const { data: relatedPosts, error: relatedError } = await supabase
      .from('entries')
      .select('*')
      .in('id', currentPost.translations);
    
    if (relatedError) {
      throw relatedError;
    }
    
    return relatedPosts as BlogEntry[] || [];
  } catch (error) {
    console.error('Error fetching related translations:', error);
    return [];
  }
};

// Save a blog post (create or update)
export const savePost = async (post: BlogEntry): Promise<BlogEntry> => {
  // Make a copy to avoid modifying the original
  const postToSave = { ...post };
  
  // Ensure all required fields are present
  if (!postToSave.language || !Array.isArray(postToSave.language)) {
    postToSave.language = Array.isArray(postToSave.language) 
      ? postToSave.language 
      : [postToSave.language || "English"];
  }
  
  if (!postToSave.title_language || !Array.isArray(postToSave.title_language)) {
    postToSave.title_language = Array.isArray(postToSave.title_language) 
      ? postToSave.title_language 
      : [postToSave.title_language || "en"];
  }

  // Ensure tags is an array (if present)
  if (postToSave.tags && !Array.isArray(postToSave.tags)) {
    postToSave.tags = [postToSave.tags];
  }
  
  // Ensure translations is an array (if present)
  if (postToSave.translations && !Array.isArray(postToSave.translations)) {
    postToSave.translations = [postToSave.translations];
  }
  
  // Log the post being saved for debugging
  console.log('Saving post:', postToSave);
  
  // If post has an ID, update it; otherwise, insert a new one
  const { data, error } = await supabase
    .from('entries')
    .upsert(postToSave)
    .select()
    .maybeSingle();
  
  if (error) {
    console.error('Error saving post:', error);
    throw error;
  }
  
  // After saving, update the related posts to include this post in their translations
  if (postToSave.translations && postToSave.translations.length > 0) {
    await updateRelatedTranslations(postToSave.id, postToSave.translations);
  }
  
  return data as BlogEntry;
};

// Helper function to update the translations array in related posts
const updateRelatedTranslations = async (postId: string, relatedIds: string[]): Promise<void> => {
  try {
    // For each related post, add this post to its translations if not already there
    for (const relatedId of relatedIds) {
      // Get the current translations for the related post
      const { data: relatedPost, error: getError } = await supabase
        .from('entries')
        .select('translations')
        .eq('id', relatedId)
        .maybeSingle();
      
      if (getError) {
        console.error(`Error getting translations for post ${relatedId}:`, getError);
        continue;
      }
      
      // Create or update the translations array
      let updatedTranslations = relatedPost?.translations || [];
      if (!updatedTranslations.includes(postId)) {
        updatedTranslations = [...updatedTranslations, postId];
        
        // Update the related post with the new translations array
        const { error: updateError } = await supabase
          .from('entries')
          .update({ translations: updatedTranslations })
          .eq('id', relatedId);
        
        if (updateError) {
          console.error(`Error updating translations for post ${relatedId}:`, updateError);
        }
      }
    }
  } catch (error) {
    console.error('Error updating related translations:', error);
  }
};

// Delete a blog post
export const deletePost = async (id: string): Promise<void> => {
  // First, remove this post from all related posts' translations
  try {
    // Get the post to get its translations
    const { data: post, error: getError } = await supabase
      .from('entries')
      .select('translations')
      .eq('id', id)
      .maybeSingle();
    
    if (!getError && post?.translations) {
      // For each related post, remove this post from its translations
      for (const relatedId of post.translations) {
        const { data: relatedPost, error: relatedError } = await supabase
          .from('entries')
          .select('translations')
          .eq('id', relatedId)
          .maybeSingle();
        
        if (!relatedError && relatedPost?.translations) {
          const updatedTranslations = relatedPost.translations.filter(t => t !== id);
          
          await supabase
            .from('entries')
            .update({ translations: updatedTranslations })
            .eq('id', relatedId);
        }
      }
    }
  } catch (error) {
    console.error('Error removing post from related translations:', error);
  }
  
  // Now delete the post
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting post with ID ${id}:`, error);
    throw error;
  }
};

// Fetch posts filtered by tags and/or language - modified to use "OR" logic within filters
export const fetchFilteredPosts = async (
  tags?: string[], 
  language?: string
): Promise<BlogEntry[]> => {
  try {
    let query = supabase
      .from('entries')
      .select('*')
      .eq('status', 'published');
    
    // Add tag filter if specified - using OR logic between tags
    if (tags && tags.length > 0) {
      // Use the "overlaps" operator for OR logic between tags
      query = query.overlaps('tags', tags);
    }
    
    // Add language filter if specified
    if (language) {
      query = query.contains('language', [language]);
    }
    
    // Order by date
    query = query.order('date', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching filtered posts:', error);
      throw error;
    }
    
    return data as BlogEntry[] || [];
  } catch (error) {
    console.error('Error in fetchFilteredPosts:', error);
    throw error;
  }
};

// Re-export fetchAllTags from tagService to maintain backward compatibility
export const fetchAllTags = fetchAllTagsOriginal;

// Fetch tags by language
export const fetchTagsByLanguage = async (language: string): Promise<string[]> => {
  try {
    const allTags = await fetchAllTags();
    
    // For now, we're returning all tags regardless of language
    // In a real implementation, you might filter tags based on language
    return allTags;
  } catch (error) {
    console.error('Error fetching tags by language:', error);
    throw error;
  }
};

// Save tag
export const saveTag = async (tagName: string, translations: { en: string; he: string; ru: string }): Promise<void> => {
  try {
    const { error } = await supabase
      .from('tags')
      .insert({
        name: tagName.trim(),
        en: translations.en.trim() || tagName.trim(),
        he: translations.he.trim() || null,
        ru: translations.ru.trim() || null
      });
    
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
      .eq('name', tagName);
    
    if (error) {
      throw error;
    }
    
    // Also update posts that have this tag
    const { data: postsWithTag, error: findError } = await supabase
      .from('entries')
      .select('id, tags')
      .contains('tags', [tagName]);
    
    if (findError) {
      throw findError;
    }
    
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
};

// Export the image service functions
export { uploadImage, fetchBucketImages } from "../services/imageService";
