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

// Fetch posts filtered by tags
export const fetchFilteredPosts = async (
  tags?: string[]
): Promise<BlogEntry[]> => {
  try {
    console.log("Filtering posts with tags:", tags);
    
    let query = supabase
      .from('entries')
      .select('*')
      .eq('status', 'published');
    
    if (Array.isArray(tags) && tags.length > 0) {
      query = query.overlaps('tags', tags);
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

// Adding the fetchTagsByLanguage function
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

// Fetch about content
export const fetchAboutContent = async (): Promise<{ content: string; image_url: string | null; language?: string }> => {
  try {
    const { data, error } = await supabase
      .from('about_content')
      .select('content, image_url, language')
      .single();
    
    if (error) {
      console.error(`Error fetching about content:`, error);
      throw error;
    }
    
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

// Export the image service functions
export { uploadImage, fetchBucketImages } from "../services/imageService";
