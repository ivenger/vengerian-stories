
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

// Save a blog post (create or update)
export const savePost = async (post: BlogEntry): Promise<BlogEntry> => {
  const postToSave = { ...post };
  
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

  if (postToSave.tags && !Array.isArray(postToSave.tags)) {
    postToSave.tags = [postToSave.tags];
  }
  
  console.log('Saving post:', postToSave);
  
  const { data, error } = await supabase
    .from('entries')
    .upsert(postToSave)
    .select()
    .maybeSingle();
  
  if (error) {
    console.error('Error saving post:', error);
    throw error;
  }
  
  return data as BlogEntry;
};

// Delete a blog post
export const deletePost = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting post with ID ${id}:`, error);
    throw error;
  }
};

// Fetch posts filtered by tags and/or languages - uses OR logic for languages
export const fetchFilteredPosts = async (
  tags?: string[], 
  languages?: string[]
): Promise<BlogEntry[]> => {
  try {
    console.log("Filtering posts with tags:", tags, "and languages:", languages);
    
    let query = supabase
      .from('entries')
      .select('*')
      .eq('status', 'published');
    
    if (tags && tags.length > 0) {
      query = query.overlaps('tags', tags);
    }
    
    // Handle multiple languages using OR logic
    if (languages && languages.length > 0) {
      // This creates a condition like: language && (language.cs.{English} || language.cs.{Russian} || ...)
      const languagesFilter = languages.map(lang => `language.cs.{${lang}}`).join(',');
      query = query.or(languagesFilter);
    }
    
    query = query.order('date', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching filtered posts:', error);
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} filtered posts`);
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
    console.log("Fetching tags for language:", language);
    const allTags = await fetchAllTags();
    
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

// New functions for the About content
export const fetchAboutContent = async (language: string = "Russian"): Promise<string | { content: string; image_url: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('about_content')
      .select('content, image_url')
      .eq('language', language)
      .single();
    
    if (error) {
      console.error(`Error fetching about content for ${language}:`, error);
      throw error;
    }
    
    return data || { content: "", image_url: null };
  } catch (error) {
    console.error('Error in fetchAboutContent:', error);
    throw error;
  }
};

export const saveAboutContent = async (content: string | { content: string; image_url: string | null }, language: string): Promise<void> => {
  try {
    const contentData = typeof content === 'string' 
      ? { content, image_url: null } 
      : content;
    
    const { data: existingData } = await supabase
      .from('about_content')
      .select('id')
      .eq('language', language)
      .maybeSingle();
    
    if (existingData?.id) {
      // Update existing record
      const { error } = await supabase
        .from('about_content')
        .update(contentData)
        .eq('id', existingData.id);
      
      if (error) throw error;
    } else {
      // Insert new record
      const { error } = await supabase
        .from('about_content')
        .insert({ ...contentData, language });
      
      if (error) throw error;
    }
  } catch (error) {
    console.error(`Error saving about content for ${language}:`, error);
    throw error;
  }
};

// Export the image service functions
export { uploadImage, fetchBucketImages } from "../services/imageService";
