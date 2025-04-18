
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches about page content from Supabase
 * @param signal Optional AbortSignal for cancelling the request
 * @param language Optional language filter
 */
export async function fetchAboutContent(signal?: AbortSignal, language?: string) {
  console.log(`AboutService: Fetching content with language: ${language || 'default'}`);
  
  try {
    const queryStartTime = Date.now();
    console.log(`AboutService: Starting query at ${new Date().toISOString()}`);

    // Set up a query timeout that's shorter than the global timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Query timeout - taking too long to respond"));
      }, 5000); // 5 second timeout
    });

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
    const queryPromise = query.limit(1);
    
    // Race between the query and the timeout
    const { data, error } = await Promise.race([
      queryPromise,
      timeoutPromise.then(() => {
        throw new Error("Query timeout");
      })
    ]) as any;
    
    const queryEndTime = Date.now();
    console.log(`AboutService: Query completed in ${queryEndTime - queryStartTime}ms`);

    if (error) {
      console.error("AboutService: Error fetching about content:", error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log("AboutService: No content found for the about page");
      return null;
    }

    // Return the first row from the result array
    console.log("AboutService: Content fetched successfully", data[0]);
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
    console.log(`AboutService: Updating content for language: ${language}`);
    
    const { data, error } = await supabase
      .from('about_content')
      .upsert({ content, language, image_url: imageUrl }, { onConflict: 'language' })
      .select()
      .single();

    if (error) {
      console.error("AboutService: Error updating about content:", error);
      throw error;
    }

    console.log("AboutService: Content updated successfully");
    return data;
  } catch (error: any) {
    console.error(`AboutService: Failed to update about content:`, error);
    throw new Error(`Failed to update about page content: ${error.message}`);
  }
}
