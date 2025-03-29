
import { supabase } from "../../integrations/supabase/client";
import { BlogEntry } from "../../types/blogTypes";

// Save a blog post
export const savePost = async (post: BlogEntry): Promise<BlogEntry | null> => {
  try {
    if (!post) {
      console.error("Error: Post data is required to save.");
      return null;
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
        return null;
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
        return null;
      }

      console.log('Post created successfully:', data.id);
      return data as BlogEntry;
    }
  } catch (error) {
    console.error('Failed to save post:', error);
    return null;
  }
};

// Delete a blog post
export const deletePost = async (id: string): Promise<boolean> => {
  if (!id) {
    console.error('Invalid post ID provided for deletion');
    return false;
  }
  
  console.log(`Deleting post with ID: ${id}`);
  
  try {
    const { error } = await supabase
      .from('entries')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting post:', error);
      return false;
    }
    
    console.log('Post deleted successfully:', id);
    return true;
  } catch (error) {
    console.error(`Failed to delete post with ID ${id}:`, error);
    return false;
  }
};
