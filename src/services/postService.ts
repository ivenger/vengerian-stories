import { supabase } from "../integrations/supabase/client";
import { BlogEntry } from "../types/blogTypes";

// Fetch all blog posts (for admin purposes)
export const fetchAllPosts = async (): Promise<BlogEntry[]> => {
  console.log('Fetching all posts');
  
  try {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching all posts:', error);
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} posts`);
    return data as BlogEntry[] || [];
  } catch (error) {
    console.error('Failed to fetch all posts:', error);
    throw error;
  }
};

// Fetch a blog post by ID
export const fetchPostById = async (id: string): Promise<BlogEntry> => {
  console.log(`Fetching post with ID: ${id}`);
  
  try {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('id', id)
      .single();
    
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

// Fetch all posts with optional tag filtering
export const fetchFilteredPosts = async (tags?: string[]): Promise<BlogEntry[]> => {
  console.log(`Fetching posts with tags filter:`, tags);

  try {
    let query = supabase
      .from('entries')
      .select('*')
      .eq('status', 'published')
      .order('date', { ascending: false });

    if (tags && tags.length > 0) {
      console.log(`Applying tag filters: ${tags.join(', ')}`);
      // Use a single contains query for all tags instead of multiple queries
      query = query.contains('tags', tags);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching filtered posts:', error);
      throw error;
    }

    console.log(`Fetched ${data?.length || 0} filtered posts`);
    return data as BlogEntry[] || [];
  } catch (error) {
    console.error('Failed to fetch filtered posts:', error);
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

// Mark a post as read for a user
export const markPostAsRead = async (userId: string, postId: string): Promise<void> => {
  console.log(`Marking post ${postId} as read for user ${userId}`);
  
  try {
    const { data, error } = await supabase
      .from('reading_history')
      .upsert(
        { user_id: userId, post_id: postId },
        { onConflict: 'user_id,post_id' }
      );
      
    if (error) {
      console.error("Error marking post as read:", error);
      throw error;
    }
    
    console.log(`Post ${postId} marked as read successfully`);
  } catch (error) {
    console.error("Error in markPostAsRead:", error);
    throw error;
  }
};

// Check if a post has been read by a user
export const hasReadPost = async (userId: string, postId: string): Promise<boolean> => {
  console.log(`Checking if user ${userId} has read post ${postId}`);
  
  try {
    const { data, error } = await supabase
      .from('reading_history')
      .select('*')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle();
      
    if (error) {
      console.error("Error checking if post was read:", error);
      return false; // Assume not read in case of error
    }
    
    const hasRead = !!data;
    console.log(`User ${userId} has ${hasRead ? '' : 'not '}read post ${postId}`);
    return hasRead;
  } catch (error) {
    console.error("Error in hasReadPost:", error);
    return false; // Assume not read in case of error
  }
};
