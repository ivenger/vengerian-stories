import { supabase } from "../integrations/supabase/client";
import { BlogEntry } from "../types/blogTypes";

// Fetch all blog posts (for admin purposes)
export const fetchAllPosts = async (): Promise<BlogEntry[]> => {
  console.log('Fetching all posts as admin');
  
  try {
    // First verify admin role
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('role', 'admin')
      .single();

    if (rolesError || !roles) {
      console.error('Error verifying admin role:', rolesError);
      throw new Error('Not authorized to view all posts');
    }

    // Then fetch all posts with admin privileges
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching all posts:', error);
      throw new Error(`Failed to fetch posts: ${error.message}`);
    }
    
    console.log(`Successfully fetched ${data?.length || 0} posts as admin`);
    return data as BlogEntry[] || [];
  } catch (error: any) {
    console.error('Failed to fetch all posts:', error);
    const message = error.message || 'Failed to load posts';
    throw new Error(message);
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

    // Enhanced logging for debugging authentication issues
    console.log("savePost: Starting post save operation with data:", {
      id: post.id,
      title: post.title,
      user_id: post.user_id
    });

    // Log detailed auth info to debug the issue
    const { data: sessionData } = await supabase.auth.getSession();
    const currentSession = sessionData?.session;
    
    if (!currentSession) {
      console.error("savePost: No active session found");
      throw new Error("Authentication required. Please log in again.");
    }
    
    // Additional logging about the session state
    const userMatches = post.user_id === currentSession.user.id;
    const expiresAt = currentSession.expires_at ? new Date(currentSession.expires_at * 1000) : null;
    const isExpired = expiresAt ? new Date() > expiresAt : false;
    
    console.log("savePost: Authentication state:", {
      hasSession: !!currentSession,
      userId: currentSession?.user?.id || "no user id",
      postUserId: post.user_id,
      userIdsMatch: userMatches,
      isExpired: isExpired,
      expiresAt: expiresAt?.toISOString(),
      remainingTime: expiresAt ? Math.floor((expiresAt.getTime() - Date.now()) / 1000) + " seconds" : "unknown",
    });

    if (!userMatches) {
      console.warn("savePost: Post user_id does not match session user_id");
    }

    // If session is expired or about to expire, try to refresh it
    if (isExpired || (expiresAt && new Date(expiresAt.getTime() - 5 * 60 * 1000) < new Date())) {
      console.log("savePost: Session expired or about to expire, attempting to refresh");
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error("savePost: Failed to refresh session:", refreshError);
        throw new Error(`Authentication error: ${refreshError.message}. Please log in again.`);
      }
      
      console.log("savePost: Session refreshed successfully:", {
        hasNewSession: !!refreshData.session,
        newUserId: refreshData.session?.user?.id || "no user id"
      });
    }

    // Omit the 'created_at' field from the post data
    const { created_at, ...postData } = post;

    // Ensure user_id is explicitly set
    if (!postData.user_id && currentSession?.user?.id) {
      postData.user_id = currentSession.user.id;
      console.log(`savePost: Setting user_id to ${postData.user_id}`);
    }

    if (!postData.user_id) {
      console.error("savePost: No user_id available for the post");
      throw new Error("User ID is required to save a post. Please log in again.");
    }

    if (post.id) {
      // Update existing post
      console.log(`savePost: Updating post with ID: ${post.id}`);
      const { data, error } = await supabase
        .from('entries')
        .update(postData)
        .eq('id', post.id)
        .select('*')
        .single();

      if (error) {
        console.error('savePost: Error updating post:', error);
        if (error.code === '42501') {
          throw new Error(`Permission denied: You don't have the right permissions to update this post.`);
        } else if (error.code === '401') {
          throw new Error(`Authentication error: You need to log in again.`);
        } else {
          throw new Error(`Failed to update post: ${error.message} (${error.code})`);
        }
      }

      console.log('savePost: Post updated successfully:', data.id);
      return data as BlogEntry;
    } else {
      // Create a new post
      console.log('savePost: Creating a new post');
      const { data, error } = await supabase
        .from('entries')
        .insert([postData])
        .select('*')
        .single();

      if (error) {
        console.error('savePost: Error creating post:', error);
        if (error.code === '42501') {
          throw new Error(`Permission denied: You don't have the right permissions to create posts.`);
        } else if (error.code === '401') {
          throw new Error(`Authentication error: You need to log in again.`);
        } else {
          throw new Error(`Failed to create post: ${error.message} (${error.code})`);
        }
      }

      console.log('savePost: Post created successfully:', data.id);
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
