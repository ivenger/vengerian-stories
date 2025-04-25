
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useSignOut() {
  const { toast } = useToast();
  
  const signOut = useCallback(async () => {
    console.log("useSignOut - Attempting to sign out");
    try {
      // Create a timeout promise to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sign out operation timed out')), 5000);
      });
      
      // Race between the actual signOut and the timeout
      await Promise.race([
        supabase.auth.signOut(),
        timeoutPromise
      ]);
      
      console.log("useSignOut - Signed out successfully");
      
      // Force clear local storage as a fallback
      try {
        localStorage.removeItem('sb-dvalgsvmkrqzwfcxvbxg-auth-token');
      } catch (e) {
        console.warn("Could not clear localStorage:", e);
      }
      
    } catch (err) {
      console.error("useSignOut - Error signing out:", err);
      
      // Force clear localStorage on error as a fallback
      try {
        localStorage.removeItem('sb-dvalgsvmkrqzwfcxvbxg-auth-token');
      } catch (e) {
        console.warn("Could not clear localStorage:", e);
      }
    }
  }, []);

  return { signOut };
}
