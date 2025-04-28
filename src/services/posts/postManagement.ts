
import { supabase } from "@/integrations/supabase/client";
import { BlogEntry } from "@/types/blogTypes";

export const savePost = async (post: BlogEntry): Promise<BlogEntry> => {
  try {
    if (!post) {
      console.error("Error: Post data is required to save.");
      throw new Error("Post data is required to save.");
    }

    console.log("savePost: Starting post save operation with data:", {
      id: post.id,
      title: post.title,
      user_id: post.user_id
    });

    const { data: sessionData } = await supabase.auth.getSession();
    const currentSession = sessionData?.session;
    
    if (!currentSession) {
      console.error("savePost: No active session found");
      throw new Error("Authentication required. Please log in again.");
    }

    const { created_at, ...postData } = post;

    if (!postData.user_id && currentSession?.user?.id) {
      postData.user_id = currentSession.user.id;
      console.log(`savePost: Setting user_id to ${postData.user_id}`);
    }

    if (!postData.user_id) {
      console.error("savePost: No user_id available for the post");
      throw new Error("User ID is required to save a post. Please log in again.");
    }

    if (post.id) {
      console.log(`savePost: Updating post with ID: ${post.id}`);
      const { data, error, status } = await supabase
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

      if (status === 204 || !data) {
        console.log('savePost: Post updated successfully (no data returned)');
        return postData as BlogEntry;
      }

      console.log('savePost: Post updated successfully:', data.id);
      return data as BlogEntry;
    } else {
      console.log('savePost: Creating a new post');
      const { data, error, status } = await supabase
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

      if (status === 204 || !data) {
        console.log('savePost: Post created successfully (no data returned)');
        return postData as BlogEntry;
      }

      console.log('savePost: Post created successfully:', data.id);
      return data as BlogEntry;
    }
  } catch (error: any) {
    console.error('Failed to save post:', error);
    throw new Error(`Failed to save post: ${error.message || 'Network or server error occurred'}`);
  }
};

export const deletePost = async (id: string): Promise<void> => {
  console.log(`Deleting post with ID: ${id}`);
  
  try {
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
    throw new Error(`Failed to delete post: ${error.message || 'Network or server error occurred'}`);
  }
};
