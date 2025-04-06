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
      throw new Error(`Failed to fetch posts: ${error.message} (${error.code})`);
    }
    
    console.log(`Fetched ${data?.length || 0} posts`);
    return data as BlogEntry[] || [];
  } catch (error: any) {
    console.error('Failed to fetch all posts:', error);
    // Provide more descriptive error message
    const message = error.message || 'Network or server error occurred';
    throw new Error(`Failed to fetch posts: ${message}`);
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
      throw new Error(`Failed to fetch post: ${error.message} (${error.code})`);
    }
    
    if (!data) {
      console.error('No post found with ID:', id);
      throw new Error(`Post with ID ${id} not found`);
    }
    
    console.log('Post fetched successfully:', data.id);
    return data as BlogEntry;
  } catch (error: any) {
    console.error(`Failed to fetch post with ID ${id}:`, error);
    const message = error.message || 'Network or server error occurred';
    throw new Error(`Failed to fetch post: ${message}`);
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
      throw new Error(`Failed to fetch filtered posts: ${error.message} (${error.code})`);
    }

    console.log(`Fetched ${data?.length || 0} filtered posts`);
    return data as BlogEntry[] || [];
  } catch (error: any) {
    console.error('Failed to fetch filtered posts:', error);
    const message = error.message || 'Network or server error occurred';
    throw new Error(`Failed to fetch filtered posts: ${message}`);
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
        throw new Error(`Failed to update post: ${error.message} (${error.code})`);
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
        throw new Error(`Failed to create post: ${error.message} (${error.code})`);
      }

      console.log('Post created successfully:', data.id);
      return data as BlogEntry;
    }
  } catch (error: any) {
    console.error('Failed to save post:', error);
    const message = error.message || 'Network or server error occurred';
    throw new Error(`Failed to save post: ${message}`);
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
      throw new Error(`Failed to delete post: ${error.message} (${error.code})`);
    }
    
    console.log('Post deleted successfully:', id);
  } catch (error: any) {
    console.error(`Failed to delete post with ID ${id}:`, error);
    const message = error.message || 'Network or server error occurred';
    throw new Error(`Failed to delete post: ${message}`);
  }
};

// Mark a post as read for a user - Improved error handling
export const markPostAsRead = async (userId: string, postId: string): Promise<void> => {
  console.log(`Marking post ${postId} as read for user ${userId}`);
  
  try {
    // First check if the record already exists
    const { data: existingRecord, error: checkError } = await supabase
      .from('reading_history')
      .select('user_id, post_id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle();
      
    if (checkError) {
      if (checkError.code === '406') {
        console.warn("406 Not Acceptable error when checking read status - skipping operation");
        return;
      }
      throw checkError;
    }
    
    // If record already exists, no need to insert again
    if (existingRecord) {
      console.log(`Post ${postId} already marked as read`);
      return;
    }
    
    const { error: insertError } = await supabase
      .from('reading_history')
      .insert({ 
        user_id: userId, 
        post_id: postId,
        read_at: new Date().toISOString()
      });
      
    if (insertError) {
      if (insertError.code === '406') {
        console.warn("406 Not Acceptable error when marking post as read - skipping operation");
        return;
      }
      throw insertError;
    }
    
    console.log(`Post ${postId} marked as read successfully`);
  } catch (error: any) {
    console.error("Error in markPostAsRead:", error);
    // Don't throw error for this non-critical operation
    console.warn(`Failed to mark post as read: ${error.message}`);
  }
};

// Check if a post has been read by a user - Improved error handling
export const hasReadPost = async (userId: string, postId: string): Promise<boolean> => {
  console.log(`Checking if user ${userId} has read post ${postId}`);
  
  try {
    const { data, error } = await supabase
      .from('reading_history')
      .select('user_id, post_id') // Specify columns explicitly
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle();
      
    if (error) {
      if (error.code === '406') {
        console.warn("406 Not Acceptable error when checking read status - assuming not read");
        return false;
      }
      console.error("Error checking if post was read:", error);
      return false; // Assume not read in case of error
    }
    
    const hasRead = !!data;
    console.log(`User ${userId} has ${hasRead ? '' : 'not '}read post ${postId}`);
    return hasRead;
  } catch (error: any) {
    console.error("Error in hasReadPost:", error);
    return false; // Assume not read in case of error
  }
};
