import { supabase } from "../integrations/supabase/client";

// Update the function call error
export const getAboutContent = async (language: string = 'en') => {
  try {
    const { data, error } = await supabase
      .from('about_content')
      .select('*')
      .eq('language', language as any)
      .single();
      
    if (error) throw error;
    
    return {
      content: data?.content || '',
      language: data?.language || language,
      imageUrl: data?.image_url || null
    };
  } catch (error) {
    console.error('Error fetching about content:', error);
    return {
      content: '',
      language,
      imageUrl: null
    };
  }
};

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
