
import { supabase } from "@/integrations/supabase/client";
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
  // Generate a unique filename to prevent collisions
  const filePath = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  
  console.log('Uploading image to path:', filePath);
  
  // Enable more detailed logging
  try {
    // Check if the bucket exists
    const { error: bucketError } = await supabase
      .storage
      .getBucket('blog_images');
    
    if (bucketError) {
      console.error('Error checking bucket existence:', bucketError);
      throw new Error('Storage bucket "blog_images" does not exist or is not accessible. Please create it in Supabase.');
    }

    // Try to upload the file
    const { error: uploadError, data: uploadData } = await supabase
      .storage
      .from('blog_images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      throw uploadError;
    }
    
    console.log('Upload succeeded:', uploadData);
    
    const { data } = supabase
      .storage
      .from('blog_images')
      .getPublicUrl(filePath);
    
    console.log('Image uploaded successfully, public URL:', data.publicUrl);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Detailed error in uploadImage:', error);
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
