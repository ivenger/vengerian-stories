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
  
  // Parse content field if it's JSON
  const parsedData = data?.map(post => ({
    ...post,
    content: typeof post.content === 'string' ? post.content : post.content as Record<string, string>
  })) as BlogEntry[] || [];
  
  return parsedData;
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
  
  // Parse content field if it's JSON
  const parsedData = data?.map(post => ({
    ...post,
    content: typeof post.content === 'string' ? post.content : post.content as Record<string, string>
  })) as BlogEntry[] || [];
  
  return parsedData;
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
  
  if (!data) return null;
  
  // Parse content field if it's JSON
  return {
    ...data,
    content: typeof data.content === 'string' ? data.content : data.content as Record<string, string>
  } as BlogEntry;
};

// Save a blog post (create or update)
export const savePost = async (post: BlogEntry): Promise<BlogEntry> => {
  // Make a copy to avoid modifying the original
  const postToSave = { ...post };
  
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
  
  // Parse content field if it's JSON
  return {
    ...data!,
    content: typeof data!.content === 'string' ? data!.content : data!.content as Record<string, string>
  } as BlogEntry;
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
  const filePath = `${Date.now()}_${file.name}`;
  
  const { error } = await supabase
    .storage
    .from('blog_images')
    .upload(filePath, file);
  
  if (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
  
  const { data } = supabase
    .storage
    .from('blog_images')
    .getPublicUrl(filePath);
  
  return data.publicUrl;
};
