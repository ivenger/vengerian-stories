import { supabase } from "../integrations/supabase/client";
import { BlogEntry } from "../types/blogTypes";
import { PostgrestResponse, PostgrestError, PostgrestSingleResponse } from '@supabase/supabase-js';

// Helper function to handle timeouts with proper typing
const withTimeout = async <T>(
  operation: () => Promise<PostgrestSingleResponse<T>>,
  timeoutMs = 10000
): Promise<PostgrestSingleResponse<T>> => {
  const timeoutPromise = new Promise<PostgrestSingleResponse<T>>((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
  });

  try {
    const promise = operation();
    const result = await Promise.race([promise, timeoutPromise]);
    
    if (result.error?.code === 'PGRST301' || result.error?.message?.includes('JWT')) {
      // Handle auth errors by waiting for refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      throw result.error;
    }
    
    return result;
  } catch (error: any) {
    return { 
      data: null, 
      error, 
      count: undefined,
      status: 500,
      statusText: error.message 
    };
  }
};

// Fetch filtered blog posts
export const fetchFilteredPosts = async (tags?: string[]): Promise<BlogEntry[]> => {
  console.log('Fetching filtered posts with tags:', tags);
  
  try {
    const response = await withTimeout(async () => {
      let query = supabase
        .from('entries')
        .select('*')
        .eq('status', 'published')
        .order('date', { ascending: false });

      if (tags && tags.length > 0) {
        query = query.contains('tags', tags);
      }

      return await query;
    });

    if (response.error) {
      console.error('Error fetching filtered posts:', response.error);
      throw response.error;
    }

    return response.data as BlogEntry[] || [];
  } catch (error: any) {
    console.error('Failed to fetch filtered posts:', error);
    throw error;
  }
};

// Remaining functions...

// Re-export all functions from individual service files
export * from './postService';
export * from './tagService';
export * from './aboutService';
export * from './imageService';
