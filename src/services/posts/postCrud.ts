
import { supabase } from "../../integrations/supabase/client";
import { BlogEntry } from "../../types/blogTypes";

// Fetch a blog post by ID
export const fetchPostById = async (id: string): Promise<BlogEntry> => {
  console.log(`Fetching post with ID: ${id}`);
  
  try {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching post by ID:', error);
      throw error;
    }
    
    if (!data) {
      console.error('No post found with ID:', id);
      throw new Error(`Post with ID ${id} not found`);
    }
    
    console.log('Post fetched successfully:', data.id);
    return data as BlogEntry;
  } catch (error) {
    console.error(`Failed to fetch post with ID ${id}:`, error);
    throw error;
  }
};

// Save a blog post
export const savePost = async (post: BlogEntry): Promise<BlogEntry> => {
  try {
    if (!post) {
      console.error("Error: Post data is required to save.");
      throw new Error("Post data is required to save.");
    }

    console.log("Saving post data:", {
      id: post.id,
      title: post.title,
      status: post.status,
      tags: post.tags
    });

    // Omit the 'created_at' field from the post data
    const { created_at, ...postData } = post;

    if (post.id) {
      // Update existing post
      console.log(`Updating post with ID: ${post.id}`);
      const { data, error } = await supabase
        .from('entries')
        .update(postData)
        .eq('id', post.id)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating post:', error);
        throw error;
      }

      console.log('Post updated successfully:', data.id);
      return data as BlogEntry;
    } else {
      // Create a new post
      console.log('Creating a new post');
      const { data, error } = await supabase
        .from('entries')
        .insert([postData])
        .select('*')
        .single();

      if (error) {
        console.error('Error creating post:', error);
        throw error;
      }

      console.log('Post created successfully:', data.id);
      return data as BlogEntry;
    }
  } catch (error) {
    console.error('Failed to save post:', error);
    throw error;
  }
};

// Delete a blog post
export const deletePost = async (id: string): Promise<void> => {
  console.log(`Deleting post with ID: ${id}`);
  
  try {
    const { error } = await supabase
      .from('entries')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
    
    console.log('Post deleted successfully:', id);
  } catch (error) {
    console.error(`Failed to delete post with ID ${id}:`, error);
    throw error;
  }
};
