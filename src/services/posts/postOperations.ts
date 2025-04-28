
import { supabase } from "@/integrations/supabase/client";
import { BlogEntry } from "@/types/blogTypes";
import { sanitizeHtml } from "../utils/sanitizeUtils";

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
      throw new Error(`Failed to fetch post: ${error.message} (${error.code})`);
    }
    
    if (!data) {
      console.error('No post found with ID:', id);
      throw new Error(`Post with ID ${id} not found`);
    }
    
    console.log('Post fetched successfully:', {
      id: data.id,
      title: data.title,
      content: data.content ? `${data.content.slice(0, 50)}...` : 'No content'
    });
    
    return data as BlogEntry;
  } catch (error: any) {
    console.error(`Failed to fetch post with ID ${id}:`, error);
    throw new Error(`Failed to fetch post: ${error.message || 'Network or server error occurred'}`);
  }
};

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
      query = query.contains('tags', tags);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching filtered posts:', error);
      throw new Error(`Failed to fetch filtered posts: ${error.message} (${error.code})`);
    }

    const sanitizedData = data?.map(post => ({
      ...post,
      title: sanitizeHtml(post.title),
      content: sanitizeHtml(post.content),
      excerpt: post.excerpt ? sanitizeHtml(post.excerpt) : null
    })) || [];

    console.log(`Fetched ${sanitizedData.length} filtered posts`);
    return sanitizedData as BlogEntry[];
  } catch (error: any) {
    console.error('Failed to fetch filtered posts:', error);
    throw new Error(`Failed to fetch filtered posts: ${error.message || 'Network or server error occurred'}`);
  }
};

