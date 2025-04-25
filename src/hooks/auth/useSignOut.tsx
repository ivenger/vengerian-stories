
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useSignOut() {
  const { toast } = useToast();
  
  const signOut = useCallback(async () => {
    console.log("useSignOut - Attempting to sign out");
    try {
      // Sign out without waiting for a timeout (we'll handle cleanup regardless)
      await supabase.auth.signOut();
      console.log("useSignOut - Signed out successfully");
      
      // Always clear local storage as a definitive cleanup
      try {
        localStorage.removeItem('sb-dvalgsvmkrqzwfcxvbxg-auth-token');
      } catch (e) {
        console.warn("Could not clear localStorage:", e);
      }
      
    } catch (err) {
      console.error("useSignOut - Error signing out:", err);
      
      // Force clear localStorage on error
      try {
        localStorage.removeItem('sb-dvalgsvmkrqzwfcxvbxg-auth-token');
      } catch (e) {
        console.warn("Could not clear localStorage:", e);
      }
    }
  }, []);

  return { signOut };
}
