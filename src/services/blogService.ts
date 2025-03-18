import { supabase } from "../integrations/supabase/client";
import { BlogEntry } from "../types/blogTypes";

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

// Upload an image for a blog post
export const uploadImage = async (file: File): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    
    // Upload file to the 'blog_images' bucket
    const { data, error } = await supabase.storage
      .from('blog_images')
      .upload(fileName, file);
    
    if (error) {
      console.error("Error uploading image:", error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
    
    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('blog_images')
      .getPublicUrl(data.path);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error("Error in uploadImage:", error);
    throw error;
  }
};

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
      const updates = postsWithTag.map(post => {
        return {
          id: post.id,
          tags: (post.tags || []).filter(tag => tag !== tagName)
        };
      });
      
      // Execute all updates
      const { error: updateError } = await supabase
        .from('entries')
        .upsert(updates);
      
      if (updateError) {
        console.error('Error removing tag from posts:', updateError);
        throw updateError;
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

// Fetch all images from the blog_images bucket
export const fetchBucketImages = async (): Promise<string[]> => {
  try {
    // List all files in the blog_images bucket
    const { data, error } = await supabase.storage
      .from('blog_images')
      .list();
    
    if (error) {
      console.error("Error listing images:", error);
      throw new Error(`Failed to list images: ${error.message}`);
    }
    
    // Map each file to its public URL
    const imageUrls = data.map(file => {
      const { data: urlData } = supabase.storage
        .from('blog_images')
        .getPublicUrl(file.name);
      
      return urlData.publicUrl;
    });
    
    return imageUrls;
  } catch (error) {
    console.error("Error in fetchBucketImages:", error);
    throw error;
  }
};
