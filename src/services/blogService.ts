
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
  
  const { error: uploadError } = await supabase
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
  
  const { data } = supabase
    .storage
    .from('blog_images')
    .getPublicUrl(filePath);
  
  console.log('Image uploaded successfully, public URL:', data.publicUrl);
  
  return data.publicUrl;
};

// Fetch all available tags
export const fetchAllTags = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('entries')
    .select('tags');
  
  if (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }
  
  // Extract unique tags from all posts
  const allTags = data
    .filter(post => post.tags && Array.isArray(post.tags))
    .flatMap(post => post.tags as string[])
    .filter(Boolean);
  
  // Remove duplicates
  return [...new Set(allTags)];
};
