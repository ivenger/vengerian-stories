
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches about page content from Supabase
 * @param signal Optional AbortSignal for cancelling the request
 * @param language Optional language filter
 */
export async function fetchAboutContent(signal?: AbortSignal, language?: string) {
  try {
    // Create a query builder but don't execute yet
    let query = supabase
      .from('about_content')
      .select('*');
      
    if (language) {
      query = query.eq('language', language);
    }
    
    // Add ordering by updated_at to get the most recent content first
    query = query.order('updated_at', { ascending: false });
    
    // Execute the query and get the first row
    const { data, error } = await query.limit(1);

    if (error) {
      console.error("AboutService: Error fetching about content:", error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log("AboutService: No content found for the about page");
      return null;
    }

    return data[0];
  } catch (error: any) {
    console.error(`AboutService: Failed to fetch about content:`, error);
    if (error.message?.includes('timeout')) {
      throw new Error(`The request to fetch about page content timed out. Please try again.`);
    }
    throw new Error(`Failed to fetch about page content: ${error.message}`);
  }
}

/**
 * Updates about page content
 * @param content Content text in markdown format
 * @param language Content language
 * @param imageUrl Optional image URL
 */
export async function updateAboutContent(content: string, language: string, imageUrl?: string) {
  try {
    const { data, error } = await supabase
      .from('about_content')
      .upsert({ content, language, image_url: imageUrl }, { onConflict: 'language' })
      .select()
      .single();

    if (error) {
      console.error("AboutService: Error updating about content:", error);
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error(`AboutService: Failed to update about content:`, error);
    throw new Error(`Failed to update about page content: ${error.message}`);
  }
}
