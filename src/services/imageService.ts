
import { supabase } from "../integrations/supabase/client";

// Upload an image for a blog post
export const uploadImage = async (file: File): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    
    // Upload file to the 'blog_images' bucket
    const { data, error } = await supabase.storage
      .from('blog_images')
      .upload(fileName, file);
    
    if (error) {
      console.error("Error uploading image:", error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
    
    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('blog_images')
      .getPublicUrl(data.path);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error("Error in uploadImage:", error);
    throw error;
  }
};

// Fetch all images from the blog_images bucket
export const fetchBucketImages = async (): Promise<string[]> => {
  try {
    // List all files in the blog_images bucket
    const { data, error } = await supabase.storage
      .from('blog_images')
      .list();
    
    if (error) {
      console.error("Error listing images:", error);
      throw new Error(`Failed to list images: ${error.message}`);
    }
    
    // Map each file to its public URL
    const imageUrls = data.map(file => {
      const { data: urlData } = supabase.storage
        .from('blog_images')
        .getPublicUrl(file.name);
      
      return urlData.publicUrl;
    });
    
    return imageUrls;
  } catch (error) {
    console.error("Error in fetchBucketImages:", error);
    throw error;
  }
};
