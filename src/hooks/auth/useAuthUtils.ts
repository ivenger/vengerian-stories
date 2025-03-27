
import { supabase } from "@/integrations/supabase/client";

/**
 * Checks if a user has admin role
 */
export const checkUserRole = async (userId: string): Promise<boolean> => {
  if (!userId) {
    console.log("No user ID provided for admin check");
    return false;
  }
  
  try {
    console.log("Checking admin role for user:", userId);
    
    // Make the RPC call to check if the user is an admin
    const { data, error } = await supabase.rpc('is_admin', { user_id: userId });
    
    if (error) {
      console.error("Error checking admin role:", error);
      throw error;
    }
    
    console.log("Admin check result:", data);
    return Boolean(data);
  } catch (err) {
    console.error("Failed to check user role:", err);
    return false;
  }
};
