import { supabase } from "../integrations/supabase/client";

// Renamed function to match imports in other files
export const fetchAboutContent = async (abortSignal?: AbortSignal) => {
  try {
    const query = supabase
      .from('about_content')
      .select('*')
      .eq('language', 'en' as any)
      .single();
    
    // AbortSignal handling needs to be done differently with Supabase
    // We'll simply execute the query as is, since abortSignal isn't supported directly
    
    const { data, error } = await query;
      
    if (error) throw error;
    
    return {
      content: data?.content || '',
      language: data?.language || 'en',
      image_url: data?.image_url || null
    };
  } catch (error) {
    console.error('Error fetching about content:', error);
    return {
      content: '',
      language: 'en',
      imageUrl: null
    };
  }
};

// Keep original function as an alias for backward compatibility
export const getAboutContent = fetchAboutContent;

export const saveAboutContent = async (content: string, imageUrl: string | null = null, language: string = 'en') => {
  try {
    // Check if content exists for this language
    const { data: existingContent } = await supabase
      .from('about_content')
      .select('id')
      .eq('language', language as any)
      .maybeSingle();

    let result;
    if (existingContent) {
      // Update existing content
      result = await supabase
        .from('about_content')
        .update({
          content,
          image_url: imageUrl
        } as any)
        .eq('language', language as any);
    } else {
      // Insert new content
      result = await supabase
        .from('about_content')
        .insert({
          language: language as any,
          content: content as any,
          image_url: imageUrl as any
        } as any);
    }

    if (result.error) throw result.error;

    return {
      content,
      language,
      imageUrl
    };
  } catch (error) {
    console.error('Error saving about content:', error);
    throw error;
  }
};
