
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
      .maybeSingle(); // Using maybeSingle instead of single to handle missing data gracefully
    
    if (error) {
      console.error('Error fetching post by ID:', error);
      throw new Error(`Failed to fetch post: ${error.message} (${error.code})`);
    }
    
    if (!data) {
      console.error('No post found with ID:', id);
      throw new Error(`Post with ID ${id} not found`);
    }
    
    // Log the actual post data for debugging
    console.log('Post fetched successfully:', {
      id: data.id,
      title: data.title,
      content: data.content ? `${data.content.slice(0, 50)}...` : 'No content'
    });
    
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

    // Log detailed auth info to debug the issue
    const { data: sessionData } = await supabase.auth.getSession();
    const currentSession = sessionData?.session;
    
    console.log("Saving post with auth state:", {
      hasSession: !!currentSession,
      userId: currentSession?.user?.id || "no user id",
      isExpired: currentSession?.expires_at ? new Date(currentSession.expires_at * 1000) < new Date() : "unknown",
    });

    console.log("Saving post data:", {
      id: post.id,
      title: post.title,
      status: post.status,
      tags: post.tags
    });

    // If session is expired or missing, try to refresh it
    if (!currentSession || (currentSession.expires_at && new Date(currentSession.expires_at * 1000) < new Date())) {
      console.log("Session expired or missing, attempting to refresh");
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error("Failed to refresh session:", refreshError);
        throw new Error(`Authentication error: ${refreshError.message}. Please log in again.`);
      }
      
      console.log("Session refreshed successfully:", !!refreshData.session);
    }

    // Omit the 'created_at' field from the post data
    const { created_at, ...postData } = post;

    // Set user_id explicitly if not present
    if (!postData.user_id && currentSession?.user?.id) {
      postData.user_id = currentSession.user.id;
      console.log(`Setting user_id to ${postData.user_id}`);
    }

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
        if (error.code === '42501') {
          throw new Error(`Permission denied: You don't have the right permissions to update this post.`);
        } else if (error.code === '401') {
          throw new Error(`Authentication error: You need to log in again.`);
        } else {
          throw new Error(`Failed to update post: ${error.message} (${error.code})`);
        }
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
        if (error.code === '42501') {
          throw new Error(`Permission denied: You don't have the right permissions to create posts.`);
        } else if (error.code === '401') {
          throw new Error(`Authentication error: You need to log in again.`);
        } else {
          throw new Error(`Failed to create post: ${error.message} (${error.code})`);
        }
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
    // Check if session is valid before proceeding
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error("Authentication required. Please log in again.");
    }
    
    const { error } = await supabase
      .from('entries')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting post:', error);
      if (error.code === '42501') {
        throw new Error(`Permission denied: You don't have the right permissions to delete this post.`);
      } else {
        throw new Error(`Failed to delete post: ${error.message} (${error.code})`);
      }
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
  } catch (error: any) {
    console.error("Error in hasReadPost:", error);
    return false; // Assume not read in case of error
  }
};
