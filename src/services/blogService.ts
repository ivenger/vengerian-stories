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
      .from('entries')
      .select('tags');
    
    if (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }
    
    // Check if data exists
    if (!data || !Array.isArray(data)) {
      console.log('No data returned from tags query');
      return [];
    }
    
    // Extract unique tags from all posts, safely handling potential nulls
    const allTags = data
      // Filter out entries without tags
      .filter(entry => entry && entry.tags && Array.isArray(entry.tags))
      // Flatten the array of tag arrays
      .flatMap(entry => entry.tags || [])
      // Remove empty/null values
      .filter(Boolean);
    
    // Remove duplicates
    return [...new Set(allTags)];
  } catch (error) {
    console.error('Error in fetchAllTags:', error);
    return []; // Return empty array on error
  }
};

// Save a tag (create or update)
export const saveTag = async (tagName: string, language: string): Promise<void> => {
  try {
    // Find posts that have this tag
    const { data: existingPosts, error: findError } = await supabase
      .from('entries')
      .select('id, tags, content, date, language, title, title_language')
      .filter('tags', 'cs', `["${tagName}"]`);
    
    if (findError) {
      console.error('Error finding posts with tag:', findError);
      throw findError;
    }
    
    // No direct tag table, so we update the tag metadata by updating all posts that use this tag
    if (existingPosts && existingPosts.length > 0) {
      // Create batch update operations for all affected posts with all required fields
      const updates = existingPosts.map(post => post);
      
      // Execute all updates
      const { error: updateError } = await supabase
        .from('entries')
        .upsert(updates);
      
      if (updateError) {
        console.error('Error updating tag metadata:', updateError);
        throw updateError;
      }
    }
  } catch (error) {
    console.error('Error in saveTag:', error);
    throw error;
  }
};

// Delete a tag from all posts
export const deleteTag = async (tagName: string): Promise<void> => {
  try {
    // Find all posts with this tag
    const { data: postsWithTag, error: findError } = await supabase
      .from('entries')
      .select('id, tags, content, date, language, title, title_language')
      .filter('tags', 'cs', `["${tagName}"]`);
    
    if (findError) {
      console.error('Error finding posts with tag:', findError);
      throw findError;
    }
    
    if (postsWithTag && postsWithTag.length > 0) {
      // Update each post to remove the tag, maintaining all required fields
      const updates = postsWithTag.map(post => {
        return {
          ...post,
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
  } catch (error) {
    console.error('Error in deleteTag:', error);
    throw error;
  }
};

// Fetch posts filtered by tags and/or language
export const fetchFilteredPosts = async (
  tags?: string[], 
  language?: string
): Promise<BlogEntry[]> => {
  try {
    let query = supabase
      .from('entries')
      .select('*')
      .eq('status', 'published');
    
    // Add tag filter if specified
    if (tags && tags.length > 0) {
      // Use contains operator instead of cs for array checks
      tags.forEach(tag => {
        query = query.contains('tags', [tag]);
      });
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
