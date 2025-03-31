
import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSessionManager, SignOutResult } from "./useSessionManager";

interface AuthActions {
  signOut: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

export function useAuthActions(setSession: (session: any) => void): AuthActions {
  const { toast } = useToast();
  const { refreshSession: performRefresh, signOut: performSignOut } = useSessionManager();
  
  const refreshSession = useCallback(async () => {
    try {
      const success = await performRefresh();
      return success;
    } catch (err) {
      console.error("Error in refreshSession:", err);
      return false;
    }
  }, [performRefresh]);
  
  const signOut = async () => {
    try {
      console.log("Attempting to sign out");
      
      const result: SignOutResult = await performSignOut();
      
      if (result.error) {
        console.error("Error signing out:", result.error);
        toast({
          title: "Error",
          description: "Failed to sign out. Please try again.",
          variant: "destructive"
        });
      } else {
        console.log("Sign out successful");
        // Only set session to null AFTER a successful sign out
        setSession(null);
        
        toast({
          title: "Signed out",
          description: "You've been signed out successfully.",
        });
      }
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
    signOut,
    refreshSession,
  };
}
