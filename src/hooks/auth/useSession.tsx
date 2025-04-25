
import { useSessionInit } from "./useSessionInit";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useSession() {
  const { session, loading, error } = useSessionInit();
  const { toast } = useToast();

  const signOut = async () => {
    try {
      console.log("useSession - Signing out");
      
      // Create a timeout promise to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sign out timeout')), 5000);
      });
      
      // Race between the actual signOut and the timeout
      await Promise.race([
        supabase.auth.signOut(),
        timeoutPromise
      ]).catch(err => {
        console.error("Sign out timed out or failed:", err);
        // Force clear local storage as a fallback for timeout situations
        try {
          localStorage.removeItem('sb-dvalgsvmkrqzwfcxvbxg-auth-token');
        } catch (e) {
          console.warn("Could not clear localStorage:", e);
        }
      });
      
      toast({
        title: "Signed out",
        description: "You've been signed out successfully.",
      });
    } catch (err) {
      console.error("Sign out exception:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  return {
    session,
    loading,
    error,
    signOut,
  };
}
