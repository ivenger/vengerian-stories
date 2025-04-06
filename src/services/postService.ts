import { supabase } from "../integrations/supabase/client";
import { BlogEntry } from "../types/blogTypes";

// Shared utility for session validation and retry logic
const withSessionValidation = async <T>(
  operation: () => Promise<T>,
  maxAttempts = 3
): Promise<T> => {
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    try {
      // Check session before each attempt
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          throw new Error("No valid session");
        }
      }
      
      return await operation();
    } catch (error: any) {
      attempt++;
      
      if (error.message === "No valid session" || attempt >= maxAttempts) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error("Max retry attempts reached");
};

// Fetch all blog posts (for admin purposes)
export const fetchAllPosts = async (): Promise<BlogEntry[]> => {
  console.log('Fetching all posts');
  
  return withSessionValidation(async () => {
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
  });
};

// Fetch a blog post by ID
export const fetchPostById = async (id: string): Promise<BlogEntry> => {
  console.log(`Fetching post with ID: ${id}`);
  
  return withSessionValidation(async () => {
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
  });
};

// Fetch all posts with optional tag filtering
export const fetchFilteredPosts = async (tags?: string[]): Promise<BlogEntry[]> => {
  console.log(`Fetching posts with tags filter:`, tags);

  return withSessionValidation(async () => {
    let query = supabase
      .from('entries')
      .select('*')
      .eq('status', 'published')
      .order('date', { ascending: false });

    if (tags && tags.length > 0) {
      console.log(`Applying tag filters: ${tags.join(', ')}`);
      query = query.contains('tags', tags);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching filtered posts:', error);
      throw new Error(`Failed to fetch filtered posts: ${error.message} (${error.code})`);
    }

    console.log(`Fetched ${data?.length || 0} filtered posts`);
    return data as BlogEntry[] || [];
  });
};

// Save a blog post
export const savePost = async (post: BlogEntry): Promise<BlogEntry> => {
  return withSessionValidation(async () => {
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

    const { created_at, ...postData } = post;

    if (post.id) {
      // Update existing post
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
  });
};

// Delete a blog post
export const deletePost = async (id: string): Promise<void> => {
  return withSessionValidation(async () => {
    console.log(`Deleting post with ID: ${id}`);
    
    const { error } = await supabase
      .from('entries')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting post:', error);
      throw new Error(`Failed to delete post: ${error.message} (${error.code})`);
    }
    
    console.log('Post deleted successfully:', id);
  });
};

// Mark a post as read for a user - Improved error handling
export const markPostAsRead = async (userId: string, postId: string): Promise<void> => {
  return withSessionValidation(async () => {
    console.log(`Marking post ${postId} as read for user ${userId}`);
    
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
  });
};

// Check if a post has been read by a user - Improved error handling
export const hasReadPost = async (userId: string, postId: string): Promise<boolean> => {
  return withSessionValidation(async () => {
    console.log(`Checking if user ${userId} has read post ${postId}`);
    
    const { data, error } = await supabase
      .from('reading_history')
      .select('user_id, post_id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle();
      
    if (error) {
      console.error("Error checking if post was read:", error);
      return false;
    }
    
    const hasRead = !!data;
    console.log(`User ${userId} has ${hasRead ? '' : 'not '}read post ${postId}`);
    return hasRead;
  });
};
