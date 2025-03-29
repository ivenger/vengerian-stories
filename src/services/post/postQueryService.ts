
import { supabase } from "../../integrations/supabase/client";
import { BlogEntry } from "../../types/blogTypes";

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
    return []; // Return empty array instead of throwing
  }
};

// Fetch a blog post by ID
export const fetchPostById = async (id: string): Promise<BlogEntry | null> => {
  if (!id) {
    console.error('Invalid post ID provided');
    return null;
  }
  
  console.log(`Fetching post with ID: ${id}`);
  
  try {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching post by ID:', error);
      return null;
    }
    
    if (!data) {
      console.error('No post found with ID:', id);
      return null;
    }
    
    console.log('Post fetched successfully:', data.id);
    return data as BlogEntry;
  } catch (error) {
    console.error(`Failed to fetch post with ID ${id}:`, error);
    return null;
  }
};

// Fetch all posts with optional tag filtering
export const fetchFilteredPosts = async (tags?: string[]): Promise<BlogEntry[]> => {
  console.log(`Fetching published posts with tags filter:`, tags);
  
  try {
    // Explicitly log the query we're about to run
    console.log('Building Supabase query for entries table');
    
    let query = supabase
      .from('entries')
      .select('*');
    
    // Ensure we're only getting published posts
    console.log('Adding status=published filter');
    query = query.eq('status', 'published');
      
    if (tags && tags.length > 0) {
      console.log(`Applying tag filters: ${tags.join(', ')}`);
      // For each tag, we need to check if it's in the tags array
      tags.forEach(tag => {
        query = query.contains('tags', [tag]);
      });
    }
    
    // Sort by date, newest first
    query = query.order('date', { ascending: false });
    
    console.log('Executing query against Supabase');
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching filtered posts:', error);
      return [];
    }
    
    console.log(`Fetched ${data?.length || 0} published posts`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to fetch filtered posts:', error);
    return []; // Return empty array instead of throwing
  }
};
